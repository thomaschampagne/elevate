import _ from "lodash";
import * as Q from "q";
import { AppResourcesModel } from "../models/app-resources.model";
import { MultipleActivityProcessor } from "./multiple-activity-processor";
import { StravaActivityModel } from "../models/sync/strava-activity.model";
import { SyncNotifyModel } from "../models/sync/sync-notify.model";
import { StreamActivityModel } from "../models/sync/stream-activity.model";
import { BrowserStorageType } from "../models/browser-storage-type.enum";

import { BrowserStorage } from "../browser-storage";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { CoreMessages } from "@elevate/shared/models/core-messages";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { ActivitiesChangesModel } from "@elevate/shared/models/sync/activities-changes.model";
import { SyncResultModel } from "@elevate/shared/models/sync/sync-result.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class ActivitiesSynchronize {
  public static readonly LAST_SYNC_DATE_TIME_KEY = "syncDateTime"; // TODO Move into NewBrowserStorage as static (do that for others too)
  public static readonly ACTIVITIES_KEY = "activities"; // TODO Move into NewBrowserStorage as static (do that for others too)
  public static readonly PAGES_PER_GROUP = 1; // = 20 activities with 20 activities per page.
  public static readonly ACTIVITIES_PER_PAGE = 20; // 20 usually
  public static readonly SLEEP_TIME = 1750;
  protected appResources: AppResourcesModel;
  protected userSettings: ExtensionUserSettings;
  protected extensionId: string;
  protected totalRawActivityIds: number[] = [];
  protected _endReached = false;

  constructor(
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
    athleteModelResolver: AthleteSnapshotResolver
  ) {
    this.appResources = appResources;
    this.userSettings = userSettings;
    this.extensionId = this.appResources.extensionId;
    this._multipleActivityProcessor = new MultipleActivityProcessor(
      this.appResources,
      this.userSettings,
      athleteModelResolver
    );
  }

  protected _hasBeenSyncedActivities: Activity[] = null;

  get hasBeenSyncedActivities(): Activity[] {
    return this._hasBeenSyncedActivities;
  }

  protected _multipleActivityProcessor: MultipleActivityProcessor;

  get multipleActivityProcessor(): MultipleActivityProcessor {
    return this._multipleActivityProcessor;
  }

  private _activitiesChanges: ActivitiesChangesModel = {
    added: [],
    deleted: [],
    edited: []
  };

  get activitiesChanges(): ActivitiesChangesModel {
    return this._activitiesChanges;
  }

  public static notifyBackgroundSyncStarted(extensionId: string): void {
    chrome.runtime.sendMessage(
      extensionId,
      {
        method: CoreMessages.ON_EXTERNAL_SYNC_START
      },
      (response: any) => {
        console.log(response);
      }
    );
  }

  public static notifyBackgroundSyncDone(extensionId: string, syncResult: SyncResultModel): void {
    chrome.runtime.sendMessage(
      extensionId,
      {
        method: CoreMessages.ON_EXTERNAL_SYNC_DONE,
        params: {
          syncResult: syncResult
        }
      },
      (response: any) => {
        console.log(response);
      }
    );
  }

  /**
   * Provides:
   * - activity IDs missing in the local activities (added in strava.com and not computed/stored)
   * - activity IDs to edit with their values (edited from strava.com)
   * @param rawActivities Array<StravaActivityModel>
   * @param activities Array<Activity>
   * @return ActivitiesChangesModel
   */
  public static findAddedAndEditedActivities(
    rawActivities: StravaActivityModel[],
    activities: Activity[]
  ): ActivitiesChangesModel {
    const added: number[] = [];
    const deleted: number[] = [];
    const edited: Array<{ id: number; name: string; type: ElevateSport }> = [];

    if (_.isNull(activities) || _.isUndefined(activities) || !activities) {
      activities = [];
    }

    if (!_.isEmpty(rawActivities)) {
      _.forEach(rawActivities, (rawActivity: StravaActivityModel) => {
        // Exist raw activity id in activities?
        // Seek for activity in just interrogated pages
        const foundActivity: Activity = _.find(activities, { id: rawActivity.id });

        if (foundActivity) {
          // Yes  => Check for an edit..

          if (foundActivity.name !== rawActivity.name || foundActivity.type !== rawActivity.sport_type) {
            edited.push({
              id: foundActivity.id as number,
              name: rawActivity.name,
              type: rawActivity.sport_type as ElevateSport
            });
          }
        } else {
          // No => rawActivity: Its an added activity from strava.com
          added.push(rawActivity.id);
        }
        // ... Or all other computed will be removed... if done here...
      });
    }

    return {
      added: added,
      deleted: deleted,
      edited: edited
    };
  }

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  /**
   * Provides:
   * - activity IDs to delete in the local activities (removed from strava.com)
   */
  public static findDeletedActivities(rawActivityIds: number[], activities: Activity[]): ActivitiesChangesModel {
    const added: number[] = [];
    const deleted: number[] = [];
    const edited: Array<{ id: number; name: string; type: ElevateSport }> = [];

    _.forEach(activities, (activity: Activity) => {
      // Seek for activity in just interrogated pages
      const notFound: boolean = _.indexOf(rawActivityIds, activity.id) === -1;
      if (notFound) {
        deleted.push(activity.id as number);
      }
    });

    return {
      added: added,
      deleted: deleted,
      edited: edited
    };
  }

  public appendGlobalActivitiesChanges(activitiesChangesModel: ActivitiesChangesModel): void {
    this._activitiesChanges.added = _.union(this._activitiesChanges.added, activitiesChangesModel.added);
    this._activitiesChanges.deleted = _.union(this._activitiesChanges.deleted, activitiesChangesModel.deleted);
    this._activitiesChanges.edited = _.union(this._activitiesChanges.edited, activitiesChangesModel.edited);
  }

  /**
   * @return All activities with their stream
   */
  public fetchWithStream(syncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<StreamActivityModel[]> {
    const deferred = Q.defer<StreamActivityModel[]>();

    // Start fetching missing activities
    this.fetchRawActivitiesRecursive(syncDateTime, fromPage, pagesToRead).then(
      (rawActivities: StravaActivityModel[]) => {
        // Success
        console.log(
          "Activities fetched in group " + this.printGroupLimits(fromPage, pagesToRead) + ": " + rawActivities.length
        );

        let fetchedActivitiesStreamCount = 0;
        let fetchedActivitiesProgress = 0;
        const promisesOfActivitiesStreamById: Array<Q.Promise<StreamActivityModel>> = [];

        this.getSyncedActivitiesFromLocal().then((activitiesStored: any) => {
          const activitiesChangesModel: ActivitiesChangesModel = ActivitiesSynchronize.findAddedAndEditedActivities(
            rawActivities,
            activitiesStored ? activitiesStored : []
          );
          this.appendGlobalActivitiesChanges(activitiesChangesModel); // Update global history

          // For each activity, fetch his stream and compute extended stats
          const sleepTime = this.getSleepTime();
          const fetchStreamSequence = activitiesChangesModel.added.reduce(
            (prev: Promise<number>, activityId: number) => {
              return prev.then(() => {
                // Call stream and track promise
                return this.fetchStreamByActivityId(activityId).then((streamActivityModel: StreamActivityModel) => {
                  // Track and notify progress...
                  fetchedActivitiesStreamCount++;
                  fetchedActivitiesProgress =
                    (fetchedActivitiesStreamCount / activitiesChangesModel.added.length) * 100;
                  const notify: SyncNotifyModel = {
                    step: "fetchedStreamsPercentage",
                    progress: fetchedActivitiesProgress,
                    activityId: activityId
                  };

                  deferred.notify(notify);

                  promisesOfActivitiesStreamById.push(Q.resolve(streamActivityModel));

                  return ActivitiesSynchronize.sleep(sleepTime).then(() => {
                    return Q.resolve(activityId);
                  });
                });
              });
            },
            Promise.resolve(null)
          );

          // Track all parsed activities from strava: used for deletions detect at the end..
          _.forEach(rawActivities, (rawActivity: StravaActivityModel) => {
            this.totalRawActivityIds.push(rawActivity.id);
          });

          fetchStreamSequence.then(
            () => {
              Q.allSettled(promisesOfActivitiesStreamById).then(
                (streamResults: any) => {
                  console.log(
                    "Stream length: " + streamResults.length + ", raw activities length: " + rawActivities.length + ")"
                  );

                  const activitiesWithStream: StreamActivityModel[] = [];

                  _.forEach(streamResults, (data: Q.PromiseState<any>) => {
                    if (data.state === "rejected") {
                      // No stream found for this activity
                      console.warn("Stream not found for activity <" + data.reason.activityId + ">", data);

                      // Add to activities list without even if no stream...
                      const newlyDetectedActivity: StravaActivityModel = _.find(rawActivities, {
                        id: data.reason.activityId as number
                      });
                      const activityWithStream: StreamActivityModel = newlyDetectedActivity as StreamActivityModel;
                      activityWithStream.hasPowerMeter = null;
                      activityWithStream.stream = null;
                      activitiesWithStream.push(activityWithStream);
                    } else if (data.state === "fulfilled") {
                      // Find raw activities of fetched stream and push
                      const newlyDetectedActivity: StravaActivityModel = _.find(rawActivities, {
                        id: data.value.activityId as number
                      });

                      let hasPowerMeter = true;
                      if (_.isEmpty(data.value.watts)) {
                        data.value.watts = data.value.watts_calc;
                        hasPowerMeter = false;
                      }

                      const activityWithStream: StreamActivityModel = newlyDetectedActivity as StreamActivityModel;
                      activityWithStream.hasPowerMeter = hasPowerMeter;
                      activityWithStream.stream = data.value;

                      activitiesWithStream.push(activityWithStream);
                    }
                  });

                  // Finishing... force progress @ 100% because 'rejected' promises don't call progress callback
                  const notify: SyncNotifyModel = {
                    step: "fetchedStreamsPercentage",
                    progress: 100
                  };
                  deferred.notify(notify);
                  deferred.resolve(activitiesWithStream);
                },
                (err: any) => {
                  // error, we don't enter here with allSettled...
                }
              );
            },
            error => {
              deferred.reject(error);
            }
          );
        });
      },
      (err: any) => {
        deferred.reject(err);
      },
      (progress: SyncNotifyModel) => {
        deferred.notify(progress);
      }
    );

    return deferred.promise;
  }

  public httpPageGet(perPage: number, page: number): JQueryXHR {
    return $.ajax("/athlete/training_activities?new_activity_only=false&per_page=" + perPage + "&page=" + page);
  }

  public getFirstPageRemoteActivities(): Q.Promise<{
    activitiesCountAllPages: number;
    firstPageModels: StravaActivityModel[];
  }> {
    const deferred = Q.defer<{ activitiesCountAllPages: number; firstPageModels: StravaActivityModel[] }>();

    const perPage = 1;
    const page = 1;
    const promise: JQueryXHR = this.httpPageGet(perPage, page);

    promise.then((data: { models: StravaActivityModel[]; total: number }, textStatus: string, jqXHR: JQueryXHR) => {
      if (data && _.isNumber(data.total)) {
        deferred.resolve({ activitiesCountAllPages: data.total, firstPageModels: data.models });
      } else {
        deferred.reject("No remote total activities available");
      }
    });

    return deferred.promise;
  }

  /**
   * Tell if remote first page has added or edited mismatch activities compared to local
   */
  public hasRemoteFirstPageActivitiesMismatch(): Q.Promise<{
    hasMisMatch: boolean;
    activitiesChangesModel: ActivitiesChangesModel;
  }> {
    const deferred = Q.defer<{ hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }>();

    let localActivities: Activity[] = null;

    this.getSyncedActivitiesFromLocal()
      .then((result: Activity[]) => {
        if (result && result.length > 0) {
          localActivities = result;
          return this.getFirstPageRemoteActivities();
        } else {
          deferred.reject("No local synced activities");
          return;
        }
      })
      .then((remoteFirstPage: { activitiesCountAllPages: number; firstPageModels: StravaActivityModel[] }) => {
        const activitiesChangesModel = ActivitiesSynchronize.findAddedAndEditedActivities(
          remoteFirstPage.firstPageModels,
          localActivities
        );

        const remoteFirstPageIds: number[] = _.map(
          remoteFirstPage.firstPageModels,
          (stravaActivityModel: StravaActivityModel) => {
            return stravaActivityModel.id;
          }
        );

        activitiesChangesModel.deleted = ActivitiesSynchronize.findDeletedActivities(
          remoteFirstPageIds,
          _.slice(localActivities, -1 * (remoteFirstPageIds.length - activitiesChangesModel.added.length))
        ).deleted;

        const hasAddedOrEditedActivitiesMisMatch =
          activitiesChangesModel.added.length > 0 ||
          activitiesChangesModel.edited.length > 0 ||
          activitiesChangesModel.deleted.length > 0;

        const result = {
          hasMisMatch: hasAddedOrEditedActivitiesMisMatch,
          activitiesChangesModel: activitiesChangesModel
        };

        deferred.resolve(result);
      });

    return deferred.promise;
  }

  /**
   *
   * @param syncDateTime Last sync date existing. can be null
   * @param page page to start. Equals 1 if no from page given
   * @param pagesToRead Max pages to fetch from "fromPage". 0 gives unlimited pages
   * @param pagesRidden Number of page fetched
   */
  public fetchRawActivitiesRecursive(
    syncDateTime: Date,
    page?: number,
    pagesToRead?: number,
    pagesRidden?: number,
    deferred?: Q.Deferred<any>,
    activitiesList?: StravaActivityModel[]
  ): Q.Promise<StravaActivityModel[]> {
    if (!page) {
      page = 1; // Usually start from first page when no page given
    }

    if (!pagesToRead) {
      pagesToRead = 0; // if 0 equals no pages limits
    }

    if (!pagesRidden) {
      pagesRidden = 0;
    }

    if (!deferred) {
      deferred = Q.defer<StravaActivityModel[]>();
    }

    if (!activitiesList) {
      activitiesList = [];
    }

    const perPage = ActivitiesSynchronize.ACTIVITIES_PER_PAGE;

    const promiseActivitiesRequest: JQueryXHR = this.httpPageGet(perPage, page);

    const notify: SyncNotifyModel = {
      step: "fetchActivitiesPercentage"
    };

    promiseActivitiesRequest.then(
      (data: any, textStatus: string, jqXHR: JQueryXHR) => {
        // Success...
        if (textStatus !== "success") {
          deferred.reject("Unable to get models" + textStatus);
        } else {
          // No errors...

          // If we have reached the max page to read then resolve...
          if (pagesToRead && pagesToRead === pagesRidden) {
            console.log("[PagesRidden] Resolving with " + activitiesList.length + " activities found");
            deferred.resolve(activitiesList);
          } else if (_.isEmpty(data.models)) {
            console.log("[EndReached] Resolving with " + activitiesList.length + " activities found.");
            this._endReached = true;
            deferred.resolve(activitiesList);
          } else {
            notify.totalActivities = data.total;

            // Append activities
            activitiesList = _.flatten(_.union(activitiesList, data.models));
            notify.progress =
              (activitiesList.length / (pagesToRead && perPage ? pagesToRead * perPage : notify.totalActivities)) * 100;

            deferred.notify(notify);

            setTimeout(() => {
              this.fetchRawActivitiesRecursive(
                syncDateTime,
                page + 1,
                pagesToRead,
                pagesRidden + 1,
                deferred,
                activitiesList
              );
            }, 50);
          }
        }
      },
      (data: any, textStatus: string, errorThrown: any) => {
        // error
        const err: any = {
          method: "ActivitiesSynchronize.fetchRawActivitiesRecursive",
          page,
          data,
          textStatus,
          errorThrown
        };

        console.error(err);
        deferred.reject(err);
      }
    );

    return deferred.promise;
  }

  /**
   * Fetch the stream of an activity
   */
  public fetchStreamByActivityId(activityId: number): Q.Promise<StreamActivityModel> {
    const deferred = Q.defer<StreamActivityModel>();

    const streamsUrl: string =
      "/activities/" +
      activityId +
      "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng&stream_types[]=grade_adjusted_speed";
    const promiseActivityStream = $.ajax(streamsUrl);

    promiseActivityStream.then(
      (data: any, textStatus: string, jqXHR: JQueryXHR) => {
        // success
        deferred.notify(activityId);
        data.activityId = activityId; // Append activityId resolved data
        deferred.resolve(data);
      },
      (jqXHR: JQueryXHR) => {
        const shouldStopSync = jqXHR.status === 429;

        if (shouldStopSync) {
          deferred.reject({
            streamFailure: true,
            activityId: activityId,
            statusCode: jqXHR.status,
            statusText: jqXHR.statusText
          });
        } else {
          deferred.resolve({ activityId: activityId } as any);
        }
      }
    );

    return deferred.promise;
  }

  /**
   * Erase stored last sync date and synced activities
   */
  public clearSyncCache(): Promise<void> {
    console.log("clearSyncCache requested");

    return BrowserStorage.getInstance()
      .rm(BrowserStorageType.LOCAL, ActivitiesSynchronize.ACTIVITIES_KEY)
      .then(() => {
        console.log("activities removed from local storage");
        return BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, ActivitiesSynchronize.LAST_SYNC_DATE_TIME_KEY);
      })
      .then(() => {
        console.log("syncDateTime removed from local storage");
      });
  }

  /**
   * Trigger the fetch of activities (Along last sync date), their stream and the compute of each activities.
   * @returns Promising an array of synced activities along the last sync date
   */
  public fetchAndComputeGroupOfPages(syncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<Activity[]> {
    const deferred = Q.defer();

    this.fetchWithStream(syncDateTime, fromPage, pagesToRead)
      .then(
        (activitiesWithStreams: StreamActivityModel[]) => {
          return this._multipleActivityProcessor.compute(activitiesWithStreams);
        },
        (err: any) => {
          deferred.reject(err);
          return null;
        },
        (progress: SyncNotifyModel) => {
          // fetchWithStreamProgress...
          if (progress) {
            progress.fromPage = fromPage;
            progress.toPage = fromPage + pagesToRead - 1;
            deferred.notify(progress);
          }
        }
      )
      .then(
        (activities: Activity[]) => {
          // computeSuccess...
          deferred.resolve(activities);
        },
        (err: any) => {
          // computeError...
          deferred.reject(err);
        },
        (progress: SyncNotifyModel) => {
          // computeProgress...
          if (progress) {
            progress.fromPage = fromPage;
            progress.toPage = fromPage + pagesToRead - 1;
            deferred.notify(progress);
          }
        }
      );

    return deferred.promise as Q.Promise<Activity[]>;
  }

  /**
   * For each group of pages: fetch activities, their stream, compute stats, and store result. And recursively handle next group if needed...
   */
  public computeActivitiesByGroupsOfPages(
    syncDateTime: Date,
    fromPage?: number,
    pagesPerGroupToRead?: number,
    maxGroupCount?: number,
    handledGroupCount?: number,
    deferred?: Q.Deferred<any>
  ): Q.Promise<Activity[]> {
    if (!maxGroupCount) {
      maxGroupCount = 0;
    }

    if (!handledGroupCount) {
      handledGroupCount = 0;
    }

    if (!fromPage) {
      fromPage = 1;
    }

    if (!pagesPerGroupToRead) {
      pagesPerGroupToRead = ActivitiesSynchronize.PAGES_PER_GROUP;
    }

    if (!deferred) {
      deferred = Q.defer<Activity[]>();
    }

    let activitiesInGroup: Activity[] = null;

    if (this._endReached) {
      deferred.resolve(this._hasBeenSyncedActivities);
    } else {
      this.fetchAndComputeGroupOfPages(syncDateTime, fromPage, pagesPerGroupToRead)
        .then((activitiesPromised: Activity[]) => {
          handledGroupCount++;

          JSON.stringify(activitiesPromised);

          activitiesInGroup = activitiesPromised;
          activitiesPromised = null; // Free mem !
          console.log("Group handled count: " + handledGroupCount);

          // Retrieve previous saved activities
          return this.getSyncedActivitiesFromLocal();
        })
        .then(
          (activitiesStored: Activity[]) => {
            // Success getting previous stored activities. Now merging with new...
            if (activitiesInGroup !== null && activitiesInGroup.length > 0) {
              // There's new activities to save
              if (_.isEmpty(activitiesStored)) {
                activitiesStored = [];
              }

              this._hasBeenSyncedActivities = _.flatten(_.union(activitiesInGroup, activitiesStored));

              // Sort this.mergedActivities ascending before save
              this._hasBeenSyncedActivities = _.sortBy(this._hasBeenSyncedActivities, item => {
                return new Date(item.startTime).getTime();
              });

              // Ensure activity unicity
              this._hasBeenSyncedActivities = _.uniqBy(this._hasBeenSyncedActivities, (item: Activity) => {
                return item.id;
              });

              console.log("Updating synced activities to extension local storage.");

              // Save activities to local storage
              this.saveSyncedActivitiesToLocal(this._hasBeenSyncedActivities).then(() => {
                // Current group have been saved with previously stored activities...
                const notify: SyncNotifyModel = {
                  step: "savedSyncedActivities",
                  progress: 100,
                  pageGroupId: handledGroupCount + 1,
                  browsedActivitiesCount: this.totalRawActivityIds.length
                };

                deferred.notify(notify);

                if (maxGroupCount > 0 && handledGroupCount >= maxGroupCount) {
                  console.log(
                    "Max group count of " + maxGroupCount + " reached. Handled group count: " + handledGroupCount
                  );
                  deferred.resolve();
                } else {
                  // Continue to next group, recursive call.
                  this.computeActivitiesByGroupsOfPages(
                    syncDateTime,
                    fromPage + pagesPerGroupToRead,
                    pagesPerGroupToRead,
                    maxGroupCount,
                    handledGroupCount,
                    deferred
                  );
                }

                // Free mem !
                activitiesInGroup = null;
                activitiesStored = null;
              });
            } else {
              // Current group have been saved with previously stored activities...
              console.log("Group " + this.printGroupLimits(fromPage, pagesPerGroupToRead) + " handled");

              const notify: SyncNotifyModel = {
                step: "savedSyncedActivities",
                progress: 100,
                pageGroupId: handledGroupCount + 1,
                browsedActivitiesCount: this.totalRawActivityIds.length
              };

              deferred.notify(notify);

              if (maxGroupCount > 0 && handledGroupCount >= maxGroupCount) {
                console.log(
                  "Max group count of " + maxGroupCount + " reached. Handled group count: " + handledGroupCount
                );
                deferred.resolve();
              } else {
                // Continue to next group, recursive call.
                this.computeActivitiesByGroupsOfPages(
                  syncDateTime,
                  fromPage + pagesPerGroupToRead,
                  pagesPerGroupToRead,
                  maxGroupCount,
                  handledGroupCount,
                  deferred
                );
              }

              // Free mem !
              activitiesInGroup = null;
              activitiesStored = null;
            }
          },
          (err: any) => {
            // Error...
            deferred.reject(err);
          },
          (progress: SyncNotifyModel) => {
            // computeProgress...
            deferred.notify(progress);
          }
        );
    }

    return deferred.promise;
  }

  /**
   * Trigger the computing of new activities and save the result to local storage by merging with existing activities
   * @return Q.Promise of synced activities
   */
  public sync(fastSync?: boolean): Q.Promise<SyncResultModel> {
    // let updateActivitiesInfoAtEnd: boolean = false;
    const deferred = Q.defer<SyncResultModel>();
    let syncNotify: SyncNotifyModel = {};

    let activitiesChangesModel: ActivitiesChangesModel = {
      added: [],
      edited: [],
      deleted: []
    };

    // Reset values for a sync
    this.initializeForSync();

    // Check for syncDateTime
    this.getSyncDateFromLocal()
      .then((savedSyncDateTime: any) => {
        const syncDateTime: Date = _.isNumber(savedSyncDateTime) ? new Date(savedSyncDateTime) : null;

        if (fastSync && fastSync === true) {
          console.log("Fast sync mode enabled");

          return this.hasRemoteFirstPageActivitiesMismatch().then(
            (result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
              if (result.hasMisMatch) {
                activitiesChangesModel = result.activitiesChangesModel;

                console.log("Mismatch found between local and remote activities. Syncing first page only.");
                const fromPage = 1;
                const pagesPerGroupToRead = 1;
                const maxGroupCount = 1;
                return this.computeActivitiesByGroupsOfPages(
                  syncDateTime,
                  fromPage,
                  pagesPerGroupToRead,
                  maxGroupCount
                );
              } else {
                console.log("Local and remote activities count matches.");
                return null;
              }
            }
          );
        } else {
          return this.computeActivitiesByGroupsOfPages(syncDateTime);
        }
      })
      .then(() => {
        // Let's check for deletion + apply edits
        return this.getSyncedActivitiesFromLocal();
      })
      .then((activitiesStored: Activity[]) => {
        if (activitiesStored) {
          if (fastSync && fastSync === true) {
            const hasEditedChanges = activitiesChangesModel.edited.length > 0;
            const hasDeletedChanges = activitiesChangesModel.deleted.length > 0;

            if (hasEditedChanges) {
              activitiesStored = this.applyEditedActivitiesChanges(activitiesStored, activitiesChangesModel.edited);
            }

            if (hasDeletedChanges) {
              activitiesStored = this.applyDeletedActivitiesChanges(activitiesStored, activitiesChangesModel.deleted);
            }

            return hasEditedChanges || hasDeletedChanges ? this.saveSyncedActivitiesToLocal(activitiesStored) : null;
          } else {
            activitiesChangesModel = this._activitiesChanges;

            // Check for  deletions, check for added and edited has been done in "fetchWithStream" for each group of pages
            activitiesChangesModel.deleted = ActivitiesSynchronize.findDeletedActivities(
              this.totalRawActivityIds,
              activitiesStored
            ).deleted;

            const hasEditedChanges = activitiesChangesModel.edited.length > 0;
            const hasDeletedChanges = activitiesChangesModel.deleted.length > 0;

            // Apply names/types changes
            if (hasEditedChanges) {
              activitiesStored = this.applyEditedActivitiesChanges(activitiesStored, activitiesChangesModel.edited);
            }

            // Apply deletions
            if (hasDeletedChanges) {
              activitiesStored = this.applyDeletedActivitiesChanges(activitiesStored, activitiesChangesModel.deleted);
            }

            return hasEditedChanges || hasDeletedChanges ? this.saveSyncedActivitiesToLocal(activitiesStored) : null;
          }
        } else {
          return null;
        }
      })
      .then(() => {
        // Compute Activities By Groups Of Pages done... Now updating the last sync date
        return this.updateSyncDateToNow().then(() => {
          return Promise.all([this.getSyncDateFromLocal(), this.getSyncedActivitiesFromLocal()]);
        });
      })
      .then(
        (result: any[]) => {
          const syncDateTime: number = result[0];
          const activities: Activity[] = result[1];

          // Last Sync Date Time saved... Now save syncedAthleteProfile
          syncNotify.step = "updatingSyncDateTime";
          syncNotify.progress = 100;
          deferred.notify(syncNotify);

          console.log("Last sync date time saved: ", new Date(syncDateTime));

          const syncResult: SyncResultModel = {
            activitiesChangesModel: activitiesChangesModel,
            activities: activities,
            syncDateTime: syncDateTime
          };

          deferred.resolve(syncResult); // Sync finish !!
        },
        (err: any) => {
          deferred.reject(err);
        },
        (progress: SyncNotifyModel) => {
          syncNotify = {
            step: progress.step,
            progress: progress.progress,
            index: progress.index,
            activityId: progress.activityId,
            fromPage: progress.fromPage,
            toPage: progress.toPage,
            pageGroupId: progress.pageGroupId
              ? progress.pageGroupId
              : syncNotify && syncNotify.pageGroupId
              ? syncNotify.pageGroupId
              : 1,
            browsedActivitiesCount: progress.browsedActivitiesCount
              ? progress.browsedActivitiesCount
              : syncNotify && syncNotify.browsedActivitiesCount
              ? syncNotify.browsedActivitiesCount
              : 0,
            totalActivities: progress.totalActivities
              ? progress.totalActivities
              : syncNotify && syncNotify.totalActivities
              ? syncNotify.totalActivities
              : null
          };
          deferred.notify(syncNotify);
        }
      );

    return deferred.promise;
  }

  public applyEditedActivitiesChanges(
    activitiesStored: Activity[],
    edited: Array<{ id: number; name: string; type: ElevateSport }>
  ): Activity[] {
    _.forEach(edited, editData => {
      const activityToEdit: Activity = _.find(activitiesStored, { id: editData.id });
      activityToEdit.name = editData.name;
      activityToEdit.type = editData.type;
      activityToEdit.type = editData.type;
    });
    return activitiesStored;
  }

  public updateSyncDateToNow() {
    return this.saveSyncDateToLocal(new Date().getTime());
  }

  public getSleepTime(): number {
    return ActivitiesSynchronize.SLEEP_TIME;
  }

  public saveSyncDateToLocal(timestamp: number) {
    return BrowserStorage.getInstance().set<SyncDateTime>(
      BrowserStorageType.LOCAL,
      ActivitiesSynchronize.LAST_SYNC_DATE_TIME_KEY,
      new SyncDateTime(timestamp)
    );
  }

  public getSyncDateFromLocal() {
    const deferred = Q.defer<number>();
    BrowserStorage.getInstance()
      .get<SyncDateTime>(BrowserStorageType.LOCAL, ActivitiesSynchronize.LAST_SYNC_DATE_TIME_KEY, true)
      .then(
        (result: SyncDateTime) => {
          deferred.resolve(result ? result.syncDateTime : null);
        },
        error => deferred.reject(error)
      );

    return deferred.promise;
  }

  public saveSyncedActivitiesToLocal(activities: Activity[]) {
    return BrowserStorage.getInstance().set<Activity[]>(
      BrowserStorageType.LOCAL,
      ActivitiesSynchronize.ACTIVITIES_KEY,
      activities
    );
  }

  public getSyncedActivitiesFromLocal(): Q.Promise<Activity[]> {
    const deferred = Q.defer<Activity[]>();
    BrowserStorage.getInstance()
      .get<Activity[]>(BrowserStorageType.LOCAL, ActivitiesSynchronize.ACTIVITIES_KEY)
      .then(
        (result: Activity[]) => {
          deferred.resolve(result);
        },
        error => deferred.reject(error)
      );
    return deferred.promise;
  }

  protected printGroupLimits(fromPage: number, pagesPerGroupToRead: number) {
    return "[" + fromPage + " => " + (fromPage - 1 + pagesPerGroupToRead) + "]";
  }

  protected initializeForSync() {
    this._hasBeenSyncedActivities = null;
    this._activitiesChanges = {
      added: [],
      deleted: [],
      edited: []
    };
    this._endReached = false;
    this.totalRawActivityIds = [];
  }

  private applyDeletedActivitiesChanges(activitiesStored: Activity[], deleted: number[]): Activity[] {
    _.forEach(deleted, (deleteId: number) => {
      activitiesStored = _.without(
        activitiesStored,
        _.find(activitiesStored, {
          id: deleteId
        })
      );
    });

    return activitiesStored;
  }
}
