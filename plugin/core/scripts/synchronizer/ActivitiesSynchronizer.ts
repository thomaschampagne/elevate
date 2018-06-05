import * as _ from "lodash";
import * as Q from "q";
import { Helper } from "../Helper";
import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import { StorageManager } from "../StorageManager";
import { AppResourcesModel } from "../models/app-resources.model";
import { MultipleActivityProcessor } from "../processors/MultipleActivityProcessor";
import { SyncResultModel } from "../../../shared/models/sync/sync-result.model";
import { ActivitiesChangesModel } from "./activities-changes.model";
import { SyncedActivityModel } from "../../../shared/models/sync/synced-activity.model";
import { StravaActivityModel } from "../../../shared/models/sync/strava-activity.model";
import { SyncNotifyModel } from "../../../shared/models/sync/sync-notify.model";
import { StreamActivityModel } from "../../../shared/models/sync/stream-activity.model";

export class ActivitiesSynchronizer { // TODO Rename

	public static lastSyncDateTime = "lastSyncDateTime";
	public static syncedActivities = "syncedActivities";

	protected appResources: AppResourcesModel;
	protected userSettings: UserSettingsModel;
	protected extensionId: string;
	protected totalRawActivityIds: number[] = [];
	public static pagesPerGroupToRead = 2; // = 40 activities with 20 activities per page.
	protected _hasBeenSyncedActivities: SyncedActivityModel[] = null;
	protected _multipleActivityProcessor: MultipleActivityProcessor;
	protected _endReached = false;

	private _activitiesChanges: ActivitiesChangesModel = {
		added: [],
		deleted: [],
		edited: [],
	};

	constructor(appResources: AppResourcesModel, userSettings: UserSettingsModel) {
		this.appResources = appResources;
		this.userSettings = userSettings;
		this.extensionId = this.appResources.extensionId;
		this._multipleActivityProcessor = new MultipleActivityProcessor(this.appResources, this.userSettings);
	}

	public appendGlobalActivitiesChanges(activitiesChangesModel: ActivitiesChangesModel): void {
		this._activitiesChanges.added = _.union(this._activitiesChanges.added, activitiesChangesModel.added);
		this._activitiesChanges.deleted = _.union(this._activitiesChanges.deleted, activitiesChangesModel.deleted);
		this._activitiesChanges.edited = _.union(this._activitiesChanges.edited, activitiesChangesModel.edited);
	}

	/**
	 * Provides:
	 * - activity IDs missing in the local activities (added in strava.com and not computed/stored)
	 * - activity IDs to edit with their values (edited from strava.com)
	 * @param rawActivities Array<StravaActivityModel>
	 * @param syncedActivities Array<SyncedActivityModel>
	 * @return ActivitiesChangesModel
	 */
	public static findAddedAndEditedActivities(rawActivities: StravaActivityModel[], syncedActivities: SyncedActivityModel[]): ActivitiesChangesModel {

		const added: number[] = [];
		const deleted: number[] = [];
		const edited: Array<{ id: number, name: string, type: string, display_type: string }> = [];

		if (_.isNull(syncedActivities) || _.isUndefined(syncedActivities) || !syncedActivities) {
			syncedActivities = [];
		}

		if (!_.isEmpty(rawActivities)) {

			_.forEach(rawActivities, (rawActivity: StravaActivityModel) => {

				// Exist raw activity id in activities?
				// Seek for activity in just interrogated pages
				const foundSyncedActivity: SyncedActivityModel = _.find(syncedActivities, {id: rawActivity.id});

				if (foundSyncedActivity) { // Yes  => Check for an edit..

					if (foundSyncedActivity.name !== rawActivity.name || foundSyncedActivity.type !== rawActivity.type) {
						// foundSyncedActivity.name = rawActivity.name; // Update name
						edited.push({
							id: foundSyncedActivity.id,
							name: rawActivity.name,
							type: rawActivity.type,
							display_type: rawActivity.display_type,
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

	/**
	 * Provides:
	 * - activity IDs to delete in the local activities (removed from strava.com)
	 * @param rawActivityIds
	 * @param syncedActivities
	 * @returns {null}
	 */
	public static findDeletedActivities(rawActivityIds: number[], syncedActivities: SyncedActivityModel[]): ActivitiesChangesModel {

		const added: number[] = [];
		const deleted: number[] = [];
		const edited: Array<{ id: number, name: string, type: string, display_type: string }> = [];

		_.forEach(syncedActivities, (syncedActivityModel: SyncedActivityModel) => {
			// Seek for activity in just interrogated pages
			const notFound: boolean = (_.indexOf(rawActivityIds, syncedActivityModel.id) == -1);
			if (notFound) {
				deleted.push(syncedActivityModel.id);
			}
		});

		return {
			added: added,
			deleted: deleted,
			edited: edited,
		};
	}

	/**
	 * @return All activities with their stream
	 */
	public fetchWithStream(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<StreamActivityModel[]> {

		const deferred = Q.defer<StreamActivityModel[]>();

		// Start fetching missing activities
		this.fetchRawActivitiesRecursive(lastSyncDateTime, fromPage, pagesToRead).then((rawActivities: StravaActivityModel[]) => {

			// Success
			console.log("Activities fetched in group " + this.printGroupLimits(fromPage, pagesToRead) + ": " + rawActivities.length);

			let fetchedActivitiesStreamCount = 0;
			let fetchedActivitiesProgress = 0;
			const promisesOfActivitiesStreamById: Array<Q.IPromise<StreamActivityModel>> = [];

			this.getSyncedActivitiesFromLocal().then((syncedActivitiesStored: any) => {

				// Should find added and edited activities
				const activitiesChangesModel: ActivitiesChangesModel = ActivitiesSynchronizer.findAddedAndEditedActivities(rawActivities, (syncedActivitiesStored.data) ? syncedActivitiesStored.data : []);
				this.appendGlobalActivitiesChanges(activitiesChangesModel); // Update global history

				// For each activity, fetch his stream and compute extended stats
				_.forEach(activitiesChangesModel.added, (activityId: number) => {
					// Getting promise of stream for each activity...
					promisesOfActivitiesStreamById.push(this.fetchStreamByActivityId(activityId));
				});

				// Track all parsed activities from strava: used for deletions detect at the end..
				_.forEach(rawActivities, (rawActivity: StravaActivityModel) => {
					this.totalRawActivityIds.push(rawActivity.id);
				});

				Q.allSettled(promisesOfActivitiesStreamById).then((streamResults: any) => {

					console.log("Stream length: " + streamResults.length + ", raw activities length: " + rawActivities.length + ")");

					const activitiesWithStream: StreamActivityModel[] = [];

					_.forEach(streamResults, (data: Q.PromiseState<any>) => {

						if (data.state === "rejected") {

							// No stream found for this activity
							console.warn("Stream not found for activity <" + data.reason.activityId + ">", data);

							// Add to activities list without even if no stream...
							const newlyDetectedActivity: StravaActivityModel = _.find(rawActivities, {id: data.reason.activityId});
							const activityWithStream: StreamActivityModel = newlyDetectedActivity as StreamActivityModel;
							activityWithStream.hasPowerMeter = null;
							activityWithStream.stream = null;
							activitiesWithStream.push(activityWithStream);

						} else if (data.state === "fulfilled") {

							// Find raw activities of fetched stream and push
							const newlyDetectedActivity: StravaActivityModel = _.find(rawActivities, {id: data.value.activityId});

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
						progress: 100,
					};
					deferred.notify(notify);
					deferred.resolve(activitiesWithStream);

				}, (err: any) => {
					// error, we don't enter here with allSettled...

				}, (notification: any) => {

					// Progress...
					fetchedActivitiesProgress = fetchedActivitiesStreamCount / activitiesChangesModel.added.length * 100;

					const notify: SyncNotifyModel = {
						step: "fetchedStreamsPercentage",
						progress: fetchedActivitiesProgress,
						index: notification.index,
						activityId: notification.value,
					};

					deferred.notify(notify);

					fetchedActivitiesStreamCount++;
				});

			});

		}, (err: any) => {
			deferred.reject(err);
		}, (progress: SyncNotifyModel) => {
			deferred.notify(progress);
		});

		return deferred.promise;
	}

	public httpPageGet(perPage: number, page: number): JQueryXHR {
		return $.ajax("/athlete/training_activities?new_activity_only=false&per_page=" + perPage + "&page=" + page);
	}


	public getFirstPageRemoteActivities(): Q.Promise<{ activitiesCountAllPages: number, firstPageModels: StravaActivityModel[] }> {

		const deferred = Q.defer<{ activitiesCountAllPages: number, firstPageModels: StravaActivityModel[] }>();

		const perPage = 1;
		const page = 1;
		const promise: JQueryXHR = this.httpPageGet(perPage, page);

		promise.then((data: { models: StravaActivityModel[], total: number }, textStatus: string, jqXHR: JQueryXHR) => {

			if (data && _.isNumber(data.total)) {
				deferred.resolve({activitiesCountAllPages: data.total, firstPageModels: data.models});
			} else {
				deferred.reject("No remote total activities available");
			}
		});

		return deferred.promise;
	}

	/**
	 * Tell if remote first page has added or edited mismatch activities compared to local
	 * @returns {Q.Promise<{hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel}>}
	 */
	public hasRemoteFirstPageActivitiesMismatch(): Q.Promise<{ hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }> {

		const deferred = Q.defer<{ hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }>();

		let localSyncedActivityModels: SyncedActivityModel[] = null;

		this.getSyncedActivitiesFromLocal().then((result: { data: SyncedActivityModel[] }) => {

			if (result && result.data && _.isNumber(result.data.length)) {

				localSyncedActivityModels = result.data;
				return this.getFirstPageRemoteActivities();

			} else {
				deferred.reject("No local synced activities");
				return;
			}

		}).then((remoteFirstPage: { activitiesCountAllPages: number, firstPageModels: StravaActivityModel[] }) => {

			const activitiesChangesModel = ActivitiesSynchronizer.findAddedAndEditedActivities(remoteFirstPage.firstPageModels,
				localSyncedActivityModels);

			const remoteFirstPageIds: number[] = _.map(remoteFirstPage.firstPageModels, (stravaActivityModel: StravaActivityModel) => {
				return stravaActivityModel.id;
			});

			activitiesChangesModel.deleted = ActivitiesSynchronizer.findDeletedActivities(remoteFirstPageIds,
				_.slice(localSyncedActivityModels, -1 * (remoteFirstPageIds.length - activitiesChangesModel.added.length))).deleted;

			const hasAddedOrEditedActivitiesMisMatch = (activitiesChangesModel.added.length > 0
				|| activitiesChangesModel.edited.length > 0
				|| activitiesChangesModel.deleted.length > 0);

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
	 * @param lastSyncDateTime Last sync date existing. can be null
	 * @param page page to start. Equals 1 if no from page given
	 * @param pagesToRead Max pages to fetch from "fromPage". 0 gives unlimited pages
	 * @param pagesRidden Number of page fetched
	 * @param deferred
	 * @param activitiesList
	 * @return {Q.Promise<Array<StravaActivityModel>>}
	 */
	public fetchRawActivitiesRecursive(lastSyncDateTime: Date, page?: number, pagesToRead?: number, pagesRidden?: number, deferred?: Q.Deferred<any>, activitiesList?: StravaActivityModel[]): Q.Promise<StravaActivityModel[]> {

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

		const perPage = 20;
		const promiseActivitiesRequest: JQueryXHR = this.httpPageGet(perPage, page);

		const notify: SyncNotifyModel = {
			step: "fetchActivitiesPercentage",
		};

		promiseActivitiesRequest.then((data: any, textStatus: string, jqXHR: JQueryXHR) => {

			// Success...
			if (textStatus !== "success") {

				deferred.reject("Unable to get models" + textStatus);

			} else { // No errors...

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
					notify.progress = (activitiesList.length / ((pagesToRead && perPage) ? (pagesToRead * perPage) : notify.totalActivities)) * 100;

					deferred.notify(notify);

					setTimeout(() => {
						this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
					}, 50);
				}
			}

		}, (data: any, textStatus: string, errorThrown: any) => {
			// error
			const err: any = {
				method: "ActivitiesSynchronizer.fetchRawActivitiesRecursive",
				page,
				data,
				textStatus,
				errorThrown,
			};

			console.error(err);
			deferred.reject(err);

		});

		return deferred.promise;
	}

	/**
	 * Fetch the stream of an activity
	 * @param activityId
	 * @return {Q.Promise<T>}
	 */
	public fetchStreamByActivityId(activityId: number): Q.IPromise<any> {

		const deferred = Q.defer();

		const activityStreamUrl: string = "/activities/" + activityId + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng";

		const promiseActivityStream: JQueryXHR = $.ajax(activityStreamUrl);

		promiseActivityStream.then((data: any, textStatus: any, jqXHR: JQueryXHR) => {

			// success
			deferred.notify(activityId);
			data.activityId = activityId; // Append activityId resolved data
			deferred.resolve(data);

		}, (data: any, textStatus: any, errorThrown: any) => {
			// Error
			deferred.reject({
				method: "ActivitiesSynchronizer.fetchStreamByActivityId",
				activityId,
				data,
				textStatus,
				errorThrown,
			});

		});

		return deferred.promise;
	}

	/**
	 * Erase stored last sync date and synced activities
	 * @return {Q.Promise<U>}
	 */
	public clearSyncCache(): Q.IPromise<any> {

		const promise = Helper.removeFromStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.syncedActivities).then(() => {
			console.log("syncedActivities removed from local storage");
			return Helper.removeFromStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.lastSyncDateTime);
		}).then(() => {
			console.log("lastSyncDateTime removed from local storage");
		});

		return promise;
	}

	/**
	 * Trigger the fetch of activities (Along last sync date), their stream and the compute of each activities.
	 * @returns {Q.Promise<Array<SyncedActivityModel>>} Promising an array of synced activities along the last sync date
	 */
	public fetchAndComputeGroupOfPages(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<SyncedActivityModel[]> {

		const deferred = Q.defer();

		this.fetchWithStream(lastSyncDateTime, fromPage, pagesToRead).then((activitiesWithStreams: StreamActivityModel[]) => {

			return this._multipleActivityProcessor.compute(activitiesWithStreams);

		}, (err: any) => {

			deferred.reject(err);
			return null;

		}, (progress: SyncNotifyModel) => {

			// fetchWithStreamProgress...
			if (progress) {
				progress.fromPage = fromPage;
				progress.toPage = fromPage + pagesToRead - 1;
				deferred.notify(progress);
			}

		}).then((syncedActivities: SyncedActivityModel[]) => {

			// computeSuccess...
			deferred.resolve(syncedActivities);

		}, (err: any) => {

			// computeError...
			deferred.reject(err);

		}, (progress: SyncNotifyModel) => {

			// computeProgress...
			if (progress) {
				progress.fromPage = fromPage;
				progress.toPage = fromPage + pagesToRead - 1;
				deferred.notify(progress);
			}

		});

		return (deferred.promise as Q.Promise<SyncedActivityModel[]>);
	}

	protected printGroupLimits(fromPage: number, pagesPerGroupToRead: number) {
		return "[" + fromPage + " => " + (fromPage - 1 + pagesPerGroupToRead) + "]";
	}

	/**
	 * For each group of pages: fetch activities, their stream, compute stats, and store result. And recursively handle next group if needed...
	 * @return {Q.Promise<Array<SyncedActivityModel>>}
	 */
	public computeActivitiesByGroupsOfPages(lastSyncDateTime: Date, fromPage?: number, pagesPerGroupToRead?: number, maxGroupCount?: number, handledGroupCount?: number, deferred?: Q.Deferred<any>): Q.Promise<SyncedActivityModel[]> {

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
			pagesPerGroupToRead = ActivitiesSynchronizer.pagesPerGroupToRead;
		}

		if (!deferred) {
			deferred = Q.defer<SyncedActivityModel[]>();
		}

		let syncedActivitiesInGroup: SyncedActivityModel[] = null;

		if (this._endReached) {

			deferred.resolve(this._hasBeenSyncedActivities);

		} else {

			this.fetchAndComputeGroupOfPages(lastSyncDateTime, fromPage, pagesPerGroupToRead).then((syncedActivitiesPromised: SyncedActivityModel[]) => {

				handledGroupCount++;

				syncedActivitiesInGroup = syncedActivitiesPromised;
				syncedActivitiesPromised = null; // Free mem !
				console.log("Group handled count: " + handledGroupCount);

				// Retrieve previous saved activities
				return this.getSyncedActivitiesFromLocal();

			}).then((syncedActivitiesStored: any) => {

				// Success getting previous stored activities. Now merging with new...
				if (syncedActivitiesInGroup !== null && syncedActivitiesInGroup.length > 0) {

					// There's new activities to save
					if (_.isEmpty(syncedActivitiesStored) || _.isEmpty(syncedActivitiesStored.data)) {
						syncedActivitiesStored = {};
						syncedActivitiesStored.data = [] as SyncedActivityModel[];
					}

					this._hasBeenSyncedActivities = _.flatten(_.union(syncedActivitiesInGroup, syncedActivitiesStored.data));

					// Sort this.mergedActivities ascending before save
					this._hasBeenSyncedActivities = _.sortBy(this._hasBeenSyncedActivities, (item) => {
						return (new Date(item.start_time)).getTime();
					});

					// Ensure activity unicity
					this._hasBeenSyncedActivities = _.uniqBy(this._hasBeenSyncedActivities, (item: SyncedActivityModel) => {
						return item.id;
					});

					console.log("Updating synced activities to extension local storage.");

					// Save activities to local storage
					this.saveSyncedActivitiesToLocal(this._hasBeenSyncedActivities).then((pagesGroupSaved: any) => {

						// Current group have been saved with previously stored activities...
						// console.log('Group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead) + ' saved to extension local storage, total count: ' + pagesGroupSaved.data.syncedActivities.length + ' data: ', pagesGroupSaved);

						const notify: SyncNotifyModel = {
							step: "savedSyncedActivities",
							progress: 100,
							pageGroupId: handledGroupCount + 1,
							browsedActivitiesCount: this.totalRawActivityIds.length, // pagesGroupSaved.data.syncedActivities.length,
						};

						deferred.notify(notify);

						if (maxGroupCount > 0 && handledGroupCount >= maxGroupCount) {
							console.log("Max group count of " + maxGroupCount + " reached. Handled group count: " + handledGroupCount);
							deferred.resolve();
						} else {
							// Continue to next group, recursive call.
							this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage + pagesPerGroupToRead, pagesPerGroupToRead, maxGroupCount, handledGroupCount, deferred);
						}

						// Free mem !
						syncedActivitiesInGroup = null;
						syncedActivitiesStored = null;
					});
				} else {

					// Current group have been saved with previously stored activities...
					console.log("Group " + this.printGroupLimits(fromPage, pagesPerGroupToRead) + " handled");

					const notify: SyncNotifyModel = {
						step: "savedSyncedActivities",
						progress: 100,
						pageGroupId: handledGroupCount + 1,
						browsedActivitiesCount: this.totalRawActivityIds.length,
					};

					deferred.notify(notify);

					if (maxGroupCount > 0 && handledGroupCount >= maxGroupCount) {
						console.log("Max group count of " + maxGroupCount + " reached. Handled group count: " + handledGroupCount);
						deferred.resolve();
					} else {
						// Continue to next group, recursive call.
						this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage + pagesPerGroupToRead, pagesPerGroupToRead, maxGroupCount, handledGroupCount, deferred);
					}

					// Free mem !
					syncedActivitiesInGroup = null;
					syncedActivitiesStored = null;
				}

			}, (err: any) => {
				// Error...
				deferred.reject(err);

			}, (progress: SyncNotifyModel) => {

				// computeProgress...
				deferred.notify(progress);

			});
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

		// Check for lastSyncDateTime
		this.getLastSyncDateFromLocal().then((savedLastSyncDateTime: any) => {

			const lastSyncDateTime: Date = (savedLastSyncDateTime.data && _.isNumber(savedLastSyncDateTime.data)) ? new Date(savedLastSyncDateTime.data) : null;

			if (fastSync && fastSync === true) {

				console.log("Fast sync mode enabled");

				return this.hasRemoteFirstPageActivitiesMismatch().then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {

					if (result.hasMisMatch) {

						activitiesChangesModel = result.activitiesChangesModel;

						console.log("Mismatch found between local and remote activities. Syncing first page only.");
						const fromPage = 1;
						const pagesPerGroupToRead = 1;
						const maxGroupCount = 1;
						return this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage, pagesPerGroupToRead, maxGroupCount);

					} else {
						console.log("Local and remote activities count matches.");
						return null;
					}
				});

			} else {
				return this.computeActivitiesByGroupsOfPages(lastSyncDateTime);
			}

		}).then(() => {

			// Let's check for deletion + apply edits
			return this.getSyncedActivitiesFromLocal();

		}).then((syncedActivitiesStored: any) => {

			if (syncedActivitiesStored && syncedActivitiesStored.data) {

				if (fastSync && fastSync === true) {

					const hasEditedChanges = activitiesChangesModel.edited.length > 0;
					const hasDeletedChanges = activitiesChangesModel.deleted.length > 0;

					if (hasEditedChanges) {
						this.applyEditedActivitiesChanges(syncedActivitiesStored.data, activitiesChangesModel.edited);
					}

					if (hasDeletedChanges) {
						this.applyDeletedActivitiesChanges(syncedActivitiesStored, activitiesChangesModel.deleted);
					}

					return (hasEditedChanges || hasDeletedChanges) ? this.saveSyncedActivitiesToLocal(syncedActivitiesStored.data) : null;

				} else {

					activitiesChangesModel = this._activitiesChanges;

					// Check for  deletions, check for added and edited has been done in "fetchWithStream" for each group of pages
					activitiesChangesModel.deleted = ActivitiesSynchronizer.findDeletedActivities(this.totalRawActivityIds, (syncedActivitiesStored.data as SyncedActivityModel[])).deleted;

					const hasEditedChanges = activitiesChangesModel.edited.length > 0;
					const hasDeletedChanges = activitiesChangesModel.deleted.length > 0;

					// Apply names/types changes
					if (hasEditedChanges) {
						this.applyEditedActivitiesChanges(syncedActivitiesStored.data, activitiesChangesModel.edited);
					}

					// Apply deletions
					if (hasDeletedChanges) {
						this.applyDeletedActivitiesChanges(syncedActivitiesStored, activitiesChangesModel.deleted);
					}

					return (hasEditedChanges || hasDeletedChanges) ? this.saveSyncedActivitiesToLocal(syncedActivitiesStored.data) : null;

				}

			} else {
				return null;
			}

		}).then(() => {

			// Compute Activities By Groups Of Pages done... Now updating the last sync date
			return this.updateLastSyncDateToNow();

		}).then((saved: any) => {

			// Last Sync Date Time saved... Now save syncedAthleteProfile
			syncNotify.step = "updatingLastSyncDateTime";
			syncNotify.progress = 100;
			deferred.notify(syncNotify);

			console.log("Last sync date time saved: ", new Date(saved.data.lastSyncDateTime));

			const syncResult: SyncResultModel = {
				activitiesChangesModel: activitiesChangesModel,
				syncedActivities: saved.data.syncedActivities,
				lastSyncDateTime: saved.data.lastSyncDateTime
			};

			deferred.resolve(syncResult); // Sync finish !!

		}, (err: any) => {

			deferred.reject(err);

		}, (progress: SyncNotifyModel) => {

			syncNotify = {
				step: progress.step,
				progress: progress.progress,
				index: progress.index,
				activityId: progress.activityId,
				fromPage: progress.fromPage,
				toPage: progress.toPage,
				pageGroupId: (progress.pageGroupId) ? progress.pageGroupId : ((syncNotify && syncNotify.pageGroupId) ? syncNotify.pageGroupId : 1),
				browsedActivitiesCount: (progress.browsedActivitiesCount) ? progress.browsedActivitiesCount : ((syncNotify && syncNotify.browsedActivitiesCount) ? syncNotify.browsedActivitiesCount : 0),
				totalActivities: (progress.totalActivities) ? progress.totalActivities : ((syncNotify && syncNotify.totalActivities) ? syncNotify.totalActivities : null),
			};
			deferred.notify(syncNotify);
		});

		return deferred.promise;
	}

	private applyDeletedActivitiesChanges(syncedActivitiesStored: { data: SyncedActivityModel[] }, deleted: number[]) {
		_.forEach(deleted, (deleteId: number) => {
			syncedActivitiesStored.data = _.without(syncedActivitiesStored.data, _.find(syncedActivitiesStored.data, {
				id: deleteId,
			}));
		});
	}

	public applyEditedActivitiesChanges(syncedActivitiesStored: SyncedActivityModel[], edited: Array<{ id: number, name: string, type: string, display_type: string }>) {
		_.forEach(edited, (editData) => {
			const activityToEdit: SyncedActivityModel = _.find((syncedActivitiesStored), {id: editData.id});
			activityToEdit.name = editData.name;
			activityToEdit.type = editData.type;
			activityToEdit.display_type = editData.display_type;
		});
	}

	public updateLastSyncDateToNow() {
		return this.saveLastSyncDateToLocal((new Date()).getTime());
	}

	protected initializeForSync() {
		this._hasBeenSyncedActivities = null;
		this._activitiesChanges = {
			added: [],
			deleted: [],
			edited: [],
		};
		this._endReached = false;
		this.totalRawActivityIds = [];
	}

	public saveLastSyncDateToLocal(timestamp: number) {
		return Helper.setToStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.lastSyncDateTime, timestamp);
	}

	public getLastSyncDateFromLocal() {
		return Helper.getFromStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.lastSyncDateTime);
	}

	public saveSyncedActivitiesToLocal(syncedActivities: SyncedActivityModel[]): Q.Promise<any> {
		return Helper.setToStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.syncedActivities, syncedActivities);
	}

	public getSyncedActivitiesFromLocal(): Q.Promise<any> {
		return Helper.getFromStorage(this.extensionId, StorageManager.TYPE_LOCAL, ActivitiesSynchronizer.syncedActivities);
	}

	get multipleActivityProcessor(): MultipleActivityProcessor {
		return this._multipleActivityProcessor;
	}

	get hasBeenSyncedActivities(): SyncedActivityModel[] {
		return this._hasBeenSyncedActivities;
	}

	get activitiesChanges(): ActivitiesChangesModel {
		return this._activitiesChanges;
	}
}
