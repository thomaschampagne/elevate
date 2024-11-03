import _ from "lodash";
import * as Q from "q";
import $ from "jquery";
import { editActivityFromArray, removeActivityFromArray } from "../tools/specs-tools";
import { AppResourcesModel } from "../../scripts/models/app-resources.model";
import { ActivitiesSynchronize } from "../../scripts/processors/activities-synchronize";
import { StravaActivityModel } from "../../scripts/models/sync/strava-activity.model";
import { StreamActivityModel } from "../../scripts/models/sync/stream-activity.model";
import { SyncNotifyModel } from "../../scripts/models/sync/sync-notify.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Activity, ActivityStats, ElevationStats } from "@elevate/shared/models/sync/activity.model";
import { Constant } from "@elevate/shared/constants/constant";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { SyncResultModel } from "@elevate/shared/models/sync/sync-result.model";
import { ActivitiesChangesModel } from "@elevate/shared/models/sync/activities-changes.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

describe("ActivitiesSynchronize", () => {
  let athleteModelResolver: AthleteSnapshotResolver;
  let userSettingsMock: ExtensionUserSettings;
  let appResourcesMock: AppResourcesModel;
  let activitiesSynchronize: ActivitiesSynchronize;
  let rawPagesOfActivities: Array<{ models: Array<StravaActivityModel>; total: number }>;
  let CHROME_STORAGE_STUB: {
    // Fake stubed storage to simulate chrome local storage
    activities?: Activity[];
    syncDateTime?: number;
  };

  const addStravaActivity = (activityId: number) => {
    if (_.find(CHROME_STORAGE_STUB.activities, { id: activityId })) {
      CHROME_STORAGE_STUB.activities = removeActivityFromArray(activityId, CHROME_STORAGE_STUB.activities);
      return true;
    } else {
      return false;
    }
  };

  const editStravaActivity = (activityId: number, rawPageOfActivities: any, newName: string, newType: string) => {
    const found = _.find(rawPageOfActivities.models, { id: activityId });
    if (found) {
      rawPageOfActivities.models = editActivityFromArray(activityId, rawPageOfActivities.models, newName, newType);
      return true;
    } else {
      return false;
    }
  };

  const removeStravaActivity = (activityId: number, rawPageOfActivities: any) => {
    const found = _.find(rawPageOfActivities.models, { id: activityId });
    if (found) {
      rawPageOfActivities.models = removeActivityFromArray(activityId, rawPageOfActivities.models);
      return true;
    } else {
      return false;
    }
  };

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

    CHROME_STORAGE_STUB = {}; // Reset storage

    userSettingsMock = _.cloneDeep(ExtensionUserSettings.DEFAULT_MODEL);
    appResourcesMock = _.cloneDeep(require("../fixtures/app-resources/app-resources.json"));

    // We have 7 pages
    rawPagesOfActivities = [
      _.cloneDeep(require("../fixtures/sync/rawPage0120161213.json")), // Page 01 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0220161213.json")), // Page 02 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0320161213.json")), // Page 03 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0420161213.json")), // Page 04 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0520161213.json")), // Page 05 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0620161213.json")), // Page 06 - 20 ACT
      _.cloneDeep(require("../fixtures/sync/rawPage0720161213.json")) // Page 07 - 20 ACT
    ];

    // Setup athlete models resolution
    athleteModelResolver = new AthleteSnapshotResolver(AthleteModel.DEFAULT_MODEL);

    activitiesSynchronize = new ActivitiesSynchronize(appResourcesMock, userSettingsMock, athleteModelResolver);

    /**
     * Stubing http calls to strava training pages
     */
    spyOn(activitiesSynchronize, "httpPageGet").and.callFake((perPage: number, page: number) => {
      const defer = $.Deferred();
      const rawPagesOfActivity = rawPagesOfActivities[page - 1];
      if (rawPagesOfActivity) {
        let total = 0;
        _.forEach(rawPagesOfActivities, rawPage => {
          total += rawPage.models.length;
        });
        rawPagesOfActivity.total = total;
        defer.resolve(rawPagesOfActivity, "success");
      } else {
        defer.resolve({ models: [] }, "success"); // No models to give
      }
      return defer.promise() as any;
    });

    /**
     * Stubing activity stream promised, reduce @ 50 samples
     */
    const stream: any = _.cloneDeep(require("../fixtures/activities/723224273/stream.json"));
    stream.watts = stream.watts_calc; // because powerMeter is false

    spyOn(activitiesSynchronize, "fetchStreamByActivityId").and.callFake((activityId: number) => {
      const defer = Q.defer<any>();
      const data: any = {};
      _.forEach(_.keys(stream), (key: string) => {
        data[key] = stream[key].slice(0, 50);
      });
      data.activityId = activityId;
      defer.notify(activityId);
      defer.resolve(data);
      return defer.promise;
    });
    spyOn(activitiesSynchronize, "getSleepTime").and.returnValue(10); // Sleep 10 ms in test

    /**
     * Stub MultipleActivityProcessor:compute. Create fake analysis results
     */
    spyOn(activitiesSynchronize.multipleActivityProcessor, "compute").and.callFake(
      (activitiesWithStream: Array<StreamActivityModel>) => {
        const defer = Q.defer<Array<Activity>>();
        console.log("Spy activitiesSynchronize.multipleActivityProcessor:compute called");
        const activitiesComputed: Array<Activity> = [];
        const fakeStats: ActivityStats = {
          distance: null,
          elevationGain: null,
          elapsedTime: null,
          movingTime: null,
          pauseTime: null,
          moveRatio: null,
          calories: null,
          caloriesPerHour: null,
          scores: null,
          speed: null,
          pace: null,
          power: null,
          heartRate: null,
          cadence: null,
          grade: null,
          elevation: null
        };
        _.forEach(activitiesWithStream, (streamActivityModel: StreamActivityModel) => {
          const nowIsoDate = new Date().toISOString();
          const startTimestamp = new Date(streamActivityModel.start_time).getTime() / 1000;
          const endTimestamp = startTimestamp + streamActivityModel.elapsed_time_raw;

          const activityComputed: Activity = new Activity();
          activityComputed.id = streamActivityModel.id;
          activityComputed.name = streamActivityModel.name;
          activityComputed.type = streamActivityModel.sport_type as ElevateSport;
          activityComputed.startTimestamp = startTimestamp;
          activityComputed.endTimestamp = endTimestamp;
          activityComputed.startTime = streamActivityModel.start_time;
          activityComputed.endTime = new Date(endTimestamp * 1000).toISOString();
          activityComputed.hasPowerMeter = streamActivityModel.hasPowerMeter;
          activityComputed.trainer = streamActivityModel.trainer;
          activityComputed.commute = streamActivityModel.commute;
          activityComputed.creationTime = nowIsoDate;
          activityComputed.lastEditTime = nowIsoDate;
          activityComputed.stats = fakeStats;
          activityComputed.athleteSnapshot = streamActivityModel.athleteSnapshot;

          activityComputed.stats.movingTime = streamActivityModel.moving_time_raw;
          activityComputed.stats.elapsedTime = streamActivityModel.elapsed_time_raw;
          activityComputed.stats.distance = streamActivityModel.distance_raw;
          activityComputed.stats.moveRatio = activityComputed.stats.movingTime / activityComputed.stats.elapsedTime;
          // activityComputed.stats.calories = streamActivityModel.calories;
          activityComputed.stats.caloriesPerHour =
            activityComputed.stats.calories !== null
              ? (activityComputed.stats.calories / activityComputed.stats.elapsedTime) * Constant.SEC_HOUR_FACTOR
              : null;
          activityComputed.stats.elevationGain = streamActivityModel.elevation_gain_raw;
          activityComputed.stats.elevation = {
            ascent: streamActivityModel.elevation_gain_raw
          } as ElevationStats;

          activitiesComputed.push(_.cloneDeep(activityComputed));
        });
        defer.resolve(activitiesComputed);
        return defer.promise;
      }
    );

    /**
     * Stub:
     * - saveSyncedActivitiesToLocal
     * - getSyncedActivitiesFromLocal
     * - saveSyncDateToLocal
     * - getSyncDateFromLocal
     * - clearSyncCache
     */
    spyOn(activitiesSynchronize, "saveSyncedActivitiesToLocal").and.callFake((activities: Array<Activity>) => {
      const defer = Q.defer<Array<Activity>>();
      CHROME_STORAGE_STUB.activities = activities;
      defer.resolve();
      return defer.promise as any;
    });

    spyOn(activitiesSynchronize, "getSyncedActivitiesFromLocal").and.callFake(() => {
      const defer = Q.defer<Array<Activity>>();
      defer.resolve(CHROME_STORAGE_STUB.activities);
      return defer.promise;
    });

    spyOn(activitiesSynchronize, "saveSyncDateToLocal").and.callFake((timestamp: number) => {
      const defer = Q.defer<void>();
      CHROME_STORAGE_STUB.syncDateTime = timestamp;
      defer.resolve();
      return defer.promise as any;
    });

    spyOn(activitiesSynchronize, "getSyncDateFromLocal").and.callFake(() => {
      const defer = Q.defer<number>();
      defer.resolve(CHROME_STORAGE_STUB.syncDateTime ? CHROME_STORAGE_STUB.syncDateTime : null);
      return defer.promise;
    });

    spyOn(activitiesSynchronize, "clearSyncCache").and.callFake(() => {
      const defer = Q.defer<void>();
      CHROME_STORAGE_STUB = {}; // Remove all
      defer.resolve();
      return defer.promise as any;
    });
  });

  it("should ensure ActivitiesSynchronize:getFirstPageRemoteActivities()", done => {
    // Given
    const expectedCount = 140;
    const expectedFirstPageModelCount = 20;

    // When
    const remoteActivitiesCount = activitiesSynchronize.getFirstPageRemoteActivities();

    // Then
    remoteActivitiesCount.then(
      (result: { activitiesCountAllPages: number; firstPageModels: StravaActivityModel[] }) => {
        expect(result.firstPageModels.length).toEqual(expectedFirstPageModelCount);
        expect(result.activitiesCountAllPages).toEqual(expectedCount);
        done();
      },
      (err: any) => {
        expect(err).toBeNull();
        done();
      },
      (progress: SyncNotifyModel) => {
        console.log(progress);
      }
    );
  });

  it("should ensure ActivitiesSynchronize:fetchRawActivitiesRecursive()", done => {
    // Give NO last sync date or page + page to read.
    activitiesSynchronize
      .fetchRawActivitiesRecursive(null)
      .then((rawStravaActivities: Array<StravaActivityModel>) => {
        expect(activitiesSynchronize.httpPageGet).toHaveBeenCalled(); // Ensure spy call

        expect(rawStravaActivities).not.toBeNull();
        expect(rawStravaActivities.length).toEqual(20 * 7); // 140 > 7 pages

        const jeannieRide: StravaActivityModel = _.find(rawStravaActivities, { id: 718908064 }); // Find in page 1
        expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
        expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
        expect(jeannieRide.moving_time_raw).toEqual(8557);

        const relaxRide: StravaActivityModel = _.find(rawStravaActivities, { id: 642780978 }); // Find in page 1
        expect(relaxRide.name).toEqual("Relax");
        expect(relaxRide.moving_time_raw).toEqual(4888);

        const burnedRide: StravaActivityModel = _.find(rawStravaActivities, { id: 377239233 }); // Find in page 1
        expect(burnedRide.name).toEqual("Cramé !!");
        expect(burnedRide.sport_type).toEqual("Ride");
        expect(burnedRide.moving_time_raw).toEqual(4315);

        const fakeRide: StravaActivityModel = _.find(rawStravaActivities, { id: 9999999999 }); // Find in page 1
        expect(fakeRide).toBeUndefined();
        return activitiesSynchronize.fetchRawActivitiesRecursive(null, 1, 3);
      })
      .then((rawStravaActivities: Array<StravaActivityModel>) => {
        // expect(activitiesSynchronize.endReached).toBeFalsy();
        expect(rawStravaActivities.length).toEqual(20 * 3);
        return activitiesSynchronize.fetchRawActivitiesRecursive(null, 6, 3); // Can only read page 6 + 7
      })
      .then((rawStravaActivities: Array<StravaActivityModel>) => {
        // expect(activitiesSynchronize.endReached).toBeTruthy();
        expect(rawStravaActivities.length).toEqual(40); // Page 6 + 7
        return activitiesSynchronize.fetchRawActivitiesRecursive(null, 6, 1);
      })
      .then(
        (rawStravaActivities: Array<StravaActivityModel>) => {
          // expect(activitiesSynchronize.endReached).toBeFalsy();
          expect(rawStravaActivities.length).toEqual(20);
          done();
        },
        (err: any) => {
          expect(err).toBeNull();
          done();
        },
        (progress: SyncNotifyModel) => {
          console.log(progress);
        }
      );
  });

  it("should ensure ActivitiesSynchronize:fetchWithStream()", done => {
    // let fromPage = 1, pagesToRead = 3; // read 1 => 3
    activitiesSynchronize
      .fetchWithStream(null, null, null)
      .then((activitiesWithStream: Array<StreamActivityModel>) => {
        expect(activitiesSynchronize.fetchStreamByActivityId).toHaveBeenCalled(); // Ensure spy call

        expect(activitiesWithStream).not.toBeNull();
        expect(activitiesWithStream.length).toEqual(140);

        const jeannieRide: StreamActivityModel = _.find(activitiesWithStream, { id: 718908064 }); // Find "Pédalage avec Madame Jeannie Longo"
        expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
        expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
        expect(jeannieRide.moving_time_raw).toEqual(8557);
        expect(jeannieRide.stream).not.toBeNull();

        const fakeRide: StreamActivityModel = _.find(activitiesWithStream, { id: 9999999999 }); // Find fake
        expect(fakeRide).toBeUndefined();

        // Now fetch in pages 4 to 6
        return activitiesSynchronize.fetchWithStream(null, 4, 3);
      })
      .then(
        (activitiesWithStream: Array<StreamActivityModel>) => {
          // Testing activitiesSynchronize.fetchWithStream(null, 4, 3); => pages 4 to 6
          expect(activitiesWithStream).not.toBeNull();
          expect(activitiesWithStream.length).toEqual(60);
          const jeannieRide: StreamActivityModel = _.find(activitiesWithStream, { id: 718908064 }); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
          expect(jeannieRide).toBeUndefined(); // Must not exists in pages 4 to 6

          done(); // Finish it !
        },
        (err: any) => {
          expect(err).toBeNull();
          done();
        },
        (progress: SyncNotifyModel) => {
          console.log(progress);
        }
      );
  });

  it("should ensure ActivitiesSynchronize:fetchAndComputeGroupOfPages()", done => {
    // Getting all pages (7)
    activitiesSynchronize
      .fetchAndComputeGroupOfPages(null, null, null)
      .then((activitiesComputed: Array<Activity>) => {
        expect(activitiesSynchronize.multipleActivityProcessor.compute).toHaveBeenCalled(); // Ensure spy call
        expect(activitiesComputed).not.toBeNull();
        expect(activitiesComputed.length).toEqual(140);

        expect(_.first(activitiesComputed).stats).toBeDefined();
        expect(_.first(activitiesComputed).stats.heartRate).toBeNull();
        expect(_.first(activitiesComputed).stats.speed).toBeNull();

        // Now fetch in pages 7 to 10 (only 7 exists...)
        return activitiesSynchronize.fetchAndComputeGroupOfPages(null, 7, 3);
      })
      .then((activitiesComputed: Array<Activity>) => {
        // result of pages 7 to 10 (only 7 exists...)
        expect(activitiesComputed.length).toEqual(20); // Only 20 results... not 60 !

        const ride: Activity = _.find(activitiesComputed, { id: 406217194 }); // Find "Afternoon Ride"
        expect(ride.stats).toBeDefined();
        expect(ride.stats.heartRate).toBeNull();
        expect(ride.stats.speed).toBeNull();
        expect(ride.stats.movingTime).toEqual(5901);

        const jeannieRide: Activity = _.find(activitiesComputed, { id: 718908064 }); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
        expect(jeannieRide).toBeUndefined(); // Must not exists in page 7

        done();
      });
  });

  it("should ensure ActivitiesSynchronize:computeActivitiesByGroupsOfPages() all pages", done => {
    expect(activitiesSynchronize).not.toBeNull();
    expect(activitiesSynchronize).not.toBeUndefined();
    expect(activitiesSynchronize.computeActivitiesByGroupsOfPages).not.toBeUndefined();

    // Getting all pages here:
    activitiesSynchronize.computeActivitiesByGroupsOfPages(null).then((mergedSyncedActivities: Array<Activity>) => {
      expect(activitiesSynchronize.getSyncedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
      expect(activitiesSynchronize.saveSyncedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call

      expect(mergedSyncedActivities).not.toBeNull();
      expect(mergedSyncedActivities.length).toEqual(140);

      const jeannieRide: Activity = _.find(mergedSyncedActivities, { id: 718908064 }); // Find "Pédalage avec Madame Jeannie Longo"
      expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
      expect(jeannieRide.startTime).toEqual("2016-09-20T13:44:54+0000");
      expect(jeannieRide.stats.movingTime).toEqual(8557);
      expect(jeannieRide.stats).not.toBeNull();
      expect(jeannieRide.stats.heartRate).toBeNull();
      expect(jeannieRide.stats.speed).toBeNull();

      const fakeRide: Activity = _.find(mergedSyncedActivities, { id: 9999999999 }); // Find fake
      expect(fakeRide).toBeUndefined();

      expect(activitiesSynchronize.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

      done();
    });
  });

  it("should sync() when no existing stored synced activities", done => {
    expect(activitiesSynchronize.hasBeenSyncedActivities).toBeNull(); // No mergedSyncedActivities at the moment

    activitiesSynchronize
      .getSyncDateFromLocal()
      .then((savedSyncDateTime: any) => {
        // Check no last sync date
        expect(_.isNull(savedSyncDateTime) || _.isUndefined(savedSyncDateTime)).toBeTruthy();
        return activitiesSynchronize.getSyncedActivitiesFromLocal();
      })
      .then((activitiesStored: any) => {
        // Check no activitiesStored
        expect(_.isNull(activitiesStored) || _.isUndefined(activitiesStored)).toBeTruthy();
        return activitiesSynchronize.sync(); // Start sync
      })
      .then((syncResult: SyncResultModel) => {
        // Sync finished
        expect(activitiesSynchronize.getSyncedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
        expect(activitiesSynchronize.saveSyncedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call
        expect(activitiesSynchronize.getSyncDateFromLocal).toHaveBeenCalledTimes(3); // Ensure spy call
        expect(activitiesSynchronize.saveSyncDateToLocal).toHaveBeenCalledTimes(1); // Ensure spy call

        expect(syncResult.activities).not.toBeNull();
        expect(syncResult.activities.length).toEqual(140);

        const jeannieRide: Activity = _.find(syncResult.activities, { id: 718908064 }); // Find "Pédalage avec Madame Jeannie Longo"
        expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
        expect(jeannieRide.startTime).toEqual("2016-09-20T13:44:54+0000");
        expect(jeannieRide.stats.movingTime).toEqual(8557);
        expect(jeannieRide.stats).not.toBeNull();
        expect(jeannieRide.stats.heartRate).toBeNull();
        expect(jeannieRide.stats.speed).toBeNull();

        const fakeRide: Activity = _.find(syncResult.activities, { id: 9999999999 }); // Find fake
        expect(fakeRide).toBeUndefined();

        expect(activitiesSynchronize.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

        // Check syncDate & syncedAthleteProfile
        return activitiesSynchronize.getSyncDateFromLocal();
      })
      .then(
        (savedSyncDateTime: number) => {
          expect(CHROME_STORAGE_STUB.syncDateTime).not.toBeNull();
          expect(_.isNumber(CHROME_STORAGE_STUB.syncDateTime)).toBeTruthy();
          expect(savedSyncDateTime).not.toBeNull();
          expect(_.isNumber(savedSyncDateTime)).toBeTruthy();

          done();
        },
        (err: any) => {
          expect(err).toBeNull();
          done();
        },
        (progress: SyncNotifyModel) => {}
      );
  });

  it("should sync() when a new today training came up + an old one", done => {
    expect(CHROME_STORAGE_STUB.activities).toBeUndefined();
    expect(CHROME_STORAGE_STUB.syncDateTime).toBeUndefined();

    // Get a full sync, with nothing stored...
    // On sync done simulate 2 new added activities on strava.com
    // Re-sync and test...
    activitiesSynchronize
      .sync()
      .then((syncResult: SyncResultModel) => {
        // Sync is done...
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        expect(syncResult.activities.length).toEqual(CHROME_STORAGE_STUB.activities.length);

        // Add a new trainings on strava.com
        expect(addStravaActivity(799672885)).toBeTruthy(); // Add "Running back... Hard" - page 01 (removing it from last storage)
        expect(addStravaActivity(644365059)).toBeTruthy(); // Add "Sortie avec vik" - page 02 (removing it from last storage)
        expect(addStravaActivity(371317512)).toBeTruthy(); // Add "Fast Fast Fast Pschitt" - page 07 (removing it from last storage)

        // We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(syncResult.activities.length - 3);
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 799672885 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 644365059 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 371317512 } as any)).toBeUndefined();

        expect(activitiesSynchronize.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then((syncResult: SyncResultModel) => {
        expect(syncResult.activitiesChangesModel.added.length).toEqual(3);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(syncResult.activities.length);

        // We should found "Running back... Hard" act anymore in storage
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 799672885 } as any)).toBeDefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 644365059 } as any)).toBeDefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 371317512 } as any)).toBeDefined();

        done();
      });
  });

  it("should sync() when a training has been upload today to but perform 2 weeks ago, then test added first and last", done => {
    // Get a full sync, with nothing stored...
    // On sync done simulate 1 new added 2 weeks ago
    // Re-sync and test...
    activitiesSynchronize
      .sync()
      .then((syncResult: SyncResultModel) => {
        // Sync is done...
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        expect(syncResult.activities.length).toEqual(CHROME_STORAGE_STUB.activities.length);

        // Add a new trainings on strava.com
        expect(addStravaActivity(657225503)).toBeTruthy(); // Add "xxxx" - page 01 (removing it from last storage)

        // We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(syncResult.activities.length - 1);
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 657225503 } as any)).toBeUndefined();

        expect(activitiesSynchronize.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then((syncResult: SyncResultModel) => {
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(1);
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 657225503 } as any)).toBeDefined();

        // Now remove first activity and last...
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 799672885 } as any)).toBeDefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 367463594 } as any)).toBeDefined();

        expect(addStravaActivity(799672885)).toBeTruthy();
        expect(addStravaActivity(367463594)).toBeTruthy();

        expect(CHROME_STORAGE_STUB.activities.length).toEqual(138); // 140 - 2
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 799672885 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 367463594 } as any)).toBeUndefined();

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then(
        (syncResult: SyncResultModel) => {
          expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
          expect(syncResult.activities.length).toEqual(140);
          expect(syncResult.activitiesChangesModel.added.length).toEqual(2); // must be 2
          expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
          expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

          expect(_.find(CHROME_STORAGE_STUB.activities, { id: 799672885 } as any)).toBeDefined(); // must be defined!
          expect(_.find(CHROME_STORAGE_STUB.activities, { id: 367463594 } as any)).toBeDefined(); // must be defined!
          done();
        },
        (err: any) => {
          console.log("!! ERROR !!", err); // Error...
          done();
        },
        (progress: SyncNotifyModel) => {
          // computeProgress...
          // deferred.notify(progress);
        }
      );
  });

  it("should sync() when 2 activities been edited from strava.com", done => {
    // Get a full sync, with nothing stored...
    // On sync done simulate ...
    // Re-sync and test...
    activitiesSynchronize
      .sync()
      .then((syncResult: SyncResultModel) => {
        // Sync is done...
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        expect(editStravaActivity(9999999, rawPagesOfActivities[0], "FakeName", "FakeType")).toBeFalsy(); // Fake one, nothing should be edited
        expect(editStravaActivity(707356065, rawPagesOfActivities[0], "Prends donc un velo!", "Ride")).toBeTruthy(); // Page 1, "Je suis un gros lent !"
        expect(editStravaActivity(427606185, rawPagesOfActivities[5], "First Zwift", "VirtualRide")).toBeTruthy(); // Page 6, "1st zwift ride"

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then(
        (syncResult: SyncResultModel) => {
          // Sync is done...
          expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
          expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
          expect(syncResult.activities).not.toBeNull();
          expect(syncResult.activities.length).toEqual(140);

          expect(syncResult.activitiesChangesModel.added.length).toEqual(0);
          expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
          expect(syncResult.activitiesChangesModel.edited.length).toEqual(2);

          // Check return
          let ride: Activity = _.find(syncResult.activities, { id: 707356065 }); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
          expect(ride.name).toEqual("Prends donc un velo!");
          expect(ride.type).toEqual("Ride");

          let virtualRide: Activity = _.find(syncResult.activities, { id: 427606185 }); // Page 1, "First Zwift", old "1st zwift ride"
          expect(virtualRide.name).toEqual("First Zwift");
          expect(virtualRide.type).toEqual("VirtualRide");

          // Check in stub
          ride = _.find(CHROME_STORAGE_STUB.activities, { id: 707356065 }); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
          expect(ride.name).toEqual("Prends donc un velo!");
          expect(ride.type).toEqual("Ride");

          virtualRide = _.find(CHROME_STORAGE_STUB.activities, { id: 427606185 }); // Page 1, "First Zwift", old "1st zwift ride"
          expect(virtualRide.name).toEqual("First Zwift");
          expect(virtualRide.type).toEqual("VirtualRide");

          done();
        },
        (err: any) => {
          console.log("!! ERROR !!", err); // Error...
          done();
        },
        (progress: SyncNotifyModel) => {
          // computeProgress...
          // deferred.notify(progress);
        }
      );
  });

  it("should sync() when 3 activities have been removed from strava.com", done => {
    // Get a full sync, with nothing stored...
    // On sync done simulate ...
    // Re-sync and test...
    activitiesSynchronize
      .sync()
      .then((syncResult: SyncResultModel) => {
        // Sync is done...
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        expect(removeStravaActivity(9999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
        expect(removeStravaActivity(707356065, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Je suis un gros lent !"
        expect(removeStravaActivity(427606185, rawPagesOfActivities[5])).toBeTruthy(); // Page 6, "1st zwift ride"

        expect(_.find(rawPagesOfActivities[0].models, { id: 707356065 })).toBeUndefined();
        expect(_.find(rawPagesOfActivities[5].models, { id: 427606185 })).toBeUndefined();
        expect(_.find(rawPagesOfActivities[5].models, { id: 424565561 })).toBeDefined(); // Should still exists

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then(
        (syncResult: SyncResultModel) => {
          expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
          expect(CHROME_STORAGE_STUB.activities.length).toEqual(138); // -2 deleted
          expect(syncResult.activities.length).toEqual(138); // -2 deleted

          expect(syncResult.activitiesChangesModel.added.length).toEqual(0);
          expect(syncResult.activitiesChangesModel.deleted.length).toEqual(2);
          expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

          // Check returns
          const ride: Activity = _.find(CHROME_STORAGE_STUB.activities, { id: 707356065 }); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
          expect(ride).toBeUndefined();

          const virtualRide: Activity = _.find(CHROME_STORAGE_STUB.activities, {
            id: 427606185
          }); // Page 1, "First Zwift", old "1st zwift ride"
          expect(virtualRide).toBeUndefined();

          const anotherRide: Activity = _.find(CHROME_STORAGE_STUB.activities, {
            id: 424565561
          }); // Should still exists
          expect(anotherRide).toBeDefined();

          done();
        },
        (err: any) => {
          console.log("!! ERROR !!", err); // Error...
          done();
        },
        (progress: SyncNotifyModel) => {
          // computeProgress...
          // deferred.notify(progress);
        }
      );
  });

  it("should sync() when added/edited/deleted from strava.com in the same sync", done => {
    // Get a full sync, with nothing stored...
    // On sync done simulate ...
    // Re-sync and test...
    activitiesSynchronize
      .sync()
      .then((syncResult: SyncResultModel) => {
        // Sync is done...
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);
        expect(syncResult.activities.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

        /**
         * Add 3 on various pages
         */
        expect(addStravaActivity(723224273)).toBeTruthy(); // "Bon rythme ! 33 KPH !!"
        expect(addStravaActivity(556443499)).toBeTruthy(); // "75k @ 31.5 KPH // 181 BPM"
        expect(addStravaActivity(368210547)).toBeTruthy(); // "Natation"

        expect(CHROME_STORAGE_STUB.activities.length).toEqual(137); // 140 - 3
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 723224273 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 556443499 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 368210547 } as any)).toBeUndefined();
        expect(_.find(CHROME_STORAGE_STUB.activities, { id: 367463594 } as any)).toBeDefined(); // Should exists. Not removed from CHROME_STORAGE_STUB.activities

        /**
         * Edit 4 on various pages
         */
        expect(editStravaActivity(999999999, rawPagesOfActivities[0], "FakeName", "FakeType")).toBeFalsy(); // Fake one, nothing should be edited
        expect(editStravaActivity(707356065, rawPagesOfActivities[0], "Prends donc un velo!", "Ride")).toBeTruthy(); // Page 1, "Je suis un gros lent !"
        expect(editStravaActivity(569640952, rawPagesOfActivities[2], "Petit nez!", "Ride")).toBeTruthy(); // Page 3, "Pinet"
        expect(editStravaActivity(427606185, rawPagesOfActivities[5], "First Zwift", "VirtualRide")).toBeTruthy(); // Page 6, "1st zwift ride"
        expect(
          editStravaActivity(372761597, rawPagesOfActivities[6], "Rodage plaquettes new name", "EBike")
        ).toBeTruthy(); // Page 7, "Rodage plaquettes"

        expect(_.find(rawPagesOfActivities[2].models, { id: 569640952 }).name).toEqual("Petit nez!");
        expect(_.find(rawPagesOfActivities[6].models, { id: 372761597 }).sport_type).toEqual("EBike");
        expect(_.find(rawPagesOfActivities[0].models, { id: 707356065 }).sport_type).not.toEqual("EBike");

        /**
         * Delete 5 on various pages
         */
        expect(removeStravaActivity(999999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
        expect(removeStravaActivity(661113141, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Reprise apr\u00e8s vacances"
        expect(removeStravaActivity(566288762, rawPagesOfActivities[2])).toBeTruthy(); // Page 3, "Tranquille "
        expect(removeStravaActivity(552562511, rawPagesOfActivities[3])).toBeTruthy(); // Page 4, "Pererree 1.4"
        expect(removeStravaActivity(473894759, rawPagesOfActivities[4])).toBeTruthy(); // Page 5, "Zwift Watopia Easy Spin Flat"
        expect(removeStravaActivity(406217194, rawPagesOfActivities[6])).toBeTruthy(); // Page 7, "Afternoon Ride"

        expect(_.find(rawPagesOfActivities[0].models, { id: 661113141 })).toBeUndefined(); // Page 1, "Reprise apr\u00e8s vacances"
        expect(_.find(rawPagesOfActivities[2].models, { id: 566288762 })).toBeUndefined(); // Page 3, "Tranquille "
        expect(_.find(rawPagesOfActivities[3].models, { id: 552562511 })).toBeUndefined(); // Page 4, "Pererree 1.4"
        expect(_.find(rawPagesOfActivities[4].models, { id: 473894759 })).toBeUndefined(); // Page 5, "Zwift Watopia Easy Spin Flat"
        expect(_.find(rawPagesOfActivities[6].models, { id: 406217194 })).toBeUndefined(); // Page 7, "Afternoon Ride"
        expect(_.find(rawPagesOfActivities[5].models, { id: 424565561 })).toBeDefined(); // Should still exists "Chartreuse Rousse et Herbe fluo !!"

        // Ready for a new sync
        return activitiesSynchronize.sync();
      })
      .then((syncResult: SyncResultModel) => {
        expect(CHROME_STORAGE_STUB.activities).not.toBeNull();
        expect(syncResult.activities).not.toBeNull();
        expect(CHROME_STORAGE_STUB.activities.length).toEqual(135); // -5 deleted
        expect(syncResult.activities.length).toEqual(135); // -5 deleted

        expect(syncResult.activitiesChangesModel.added.length).toEqual(3);
        expect(syncResult.activitiesChangesModel.deleted.length).toEqual(5);
        expect(syncResult.activitiesChangesModel.edited.length).toEqual(4);

        // Check some edited
        let activity: Activity = _.find(CHROME_STORAGE_STUB.activities, { id: 707356065 });
        expect(activity.name).toEqual("Prends donc un velo!");
        expect(activity.type).toEqual("Ride");

        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 372761597 });
        expect(activity.name).toEqual("Rodage plaquettes new name");
        expect(activity.type).toEqual("EBike");

        // Check some added
        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 723224273 });
        expect(activity.name).toEqual("Bon rythme ! 33 KPH !!");
        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 556443499 });
        expect(activity.name).toEqual("75k @ 31.5 KPH // 181 BPM");

        // Check some deleted
        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 566288762 });
        expect(activity).toBeUndefined();

        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 473894759 });
        expect(activity).toBeUndefined();

        activity = _.find(CHROME_STORAGE_STUB.activities, { id: 424565561 });
        expect(activity).toBeDefined(); // Should still exists

        done();
      });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() reject when no local activities", done => {
    // Given, When
    const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();

    // Then
    hasMissMatchPromise.then(
      () => {
        expect(false).toBeTruthy("Should not be here !");
        done();
      },
      error => {
        expect(error).not.toBeNull();
        done();
      }
    );
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect remote added activity", done => {
    // Given
    const newStravaActivityId = 799672885;
    const promiseLocalActivity = activitiesSynchronize.sync().then((syncResult: SyncResultModel) => {
      addStravaActivity(newStravaActivityId); // New strava activity "Running back... Hard"
      return Q.resolve();
    });

    // When
    promiseLocalActivity.then(() => {
      const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
      hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
        expect(result.hasMisMatch).toBeTruthy();
        expect(result.activitiesChangesModel.added.length).toEqual(1);
        expect(result.activitiesChangesModel.edited.length).toEqual(0);
        expect(result.activitiesChangesModel.deleted.length).toEqual(0);
        done();
      });
    });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect no remote added activity", done => {
    // Given
    const promiseSynced = activitiesSynchronize.sync();

    // When
    const hasMissMatchPromise = promiseSynced.then(() => {
      return activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
    });

    // Then
    hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
      expect(result.hasMisMatch).toBeFalsy();
      expect(result.activitiesChangesModel.added.length).toEqual(0);
      expect(result.activitiesChangesModel.edited.length).toEqual(0);
      expect(result.activitiesChangesModel.deleted.length).toEqual(0);
      done();
    });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited activity", done => {
    // Given
    const editedActivityId = 727632286; // Lunch ride
    const newName = "NewName";
    const newType = "NewType";

    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
      return Q.resolve();
    });

    // When
    promiseLocalActivity.then(() => {
      const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
      hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
        expect(result.hasMisMatch).toBeTruthy();
        expect(result.activitiesChangesModel.added.length).toEqual(0);
        expect(result.activitiesChangesModel.edited.length).toEqual(1);
        expect(result.activitiesChangesModel.deleted.length).toEqual(0);
        done();
      });
    });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote deleted activity", done => {
    // Given
    const deletedActivityId = 727632286; // Lunch ride

    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
      return Q.resolve();
    });

    // When
    promiseLocalActivity.then(() => {
      const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
      hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
        expect(result.hasMisMatch).toBeTruthy();
        expect(result.activitiesChangesModel.added.length).toEqual(0);
        expect(result.activitiesChangesModel.edited.length).toEqual(0);
        expect(result.activitiesChangesModel.deleted.length).toEqual(1);
        done();
      });
    });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited and added activity", done => {
    // Given
    const editedActivityId = 727632286; // Lunch ride
    const editedActivityId2 = 722210052; // Fort saint eynard
    const addedActivityId = 723224273; // Bon rythme ! 33 KPH !!
    const deletedActivityId = 707356065; // Je suis un gros lent !

    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      editStravaActivity(editedActivityId, rawPagesOfActivities[0], "Fake", "Fake");
      editStravaActivity(editedActivityId2, rawPagesOfActivities[0], "Fake", "Fake");
      addStravaActivity(addedActivityId);
      removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
      return Q.resolve();
    });

    // When
    promiseLocalActivity.then(() => {
      const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
      hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
        expect(result.hasMisMatch).toBeTruthy();
        expect(result.activitiesChangesModel.added.length).toEqual(1);
        expect(result.activitiesChangesModel.edited.length).toEqual(2);
        expect(result.activitiesChangesModel.deleted.length).toEqual(1);
        done();
      });
    });
  });

  it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited, added activity and deleted activity", done => {
    // Given
    const editedActivityId = 727632286; // Lunch ride
    const editedActivityId2 = 722210052; // Fort saint eynard
    const addedActivityId = 723224273; // Bon rythme ! 33 KPH !!

    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      editStravaActivity(editedActivityId, rawPagesOfActivities[0], "Fake", "Fake");
      editStravaActivity(editedActivityId2, rawPagesOfActivities[0], "Fake", "Fake");
      addStravaActivity(addedActivityId);
      return Q.resolve();
    });

    // When
    promiseLocalActivity.then(() => {
      const hasMissMatchPromise = activitiesSynchronize.hasRemoteFirstPageActivitiesMismatch();
      hasMissMatchPromise.then((result: { hasMisMatch: boolean; activitiesChangesModel: ActivitiesChangesModel }) => {
        expect(result.hasMisMatch).toBeTruthy();
        expect(result.activitiesChangesModel.added.length).toEqual(1);
        expect(result.activitiesChangesModel.edited.length).toEqual(2);
        expect(result.activitiesChangesModel.deleted.length).toEqual(0);
        done();
      });
    });
  });

  it("should ensure fast sync with added activity", done => {
    // Given
    const enableFastSync = true;
    const addedStravaActivityId = 727632286; // Lunch ride
    const expectedName = "Lunch Ride";
    const expectedType = "Ride";
    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      addStravaActivity(addedStravaActivityId);
      return Q.resolve();
    });

    // When
    const promiseFastSync = promiseLocalActivity.then(() => {
      return activitiesSynchronize.sync(enableFastSync);
    });

    // Then
    promiseFastSync.then((syncResultModel: SyncResultModel) => {
      expect(syncResultModel.activitiesChangesModel.added.length).toEqual(1);
      expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
      expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

      const activity: Activity = _.find(CHROME_STORAGE_STUB.activities, {
        id: addedStravaActivityId
      });
      expect(activity.name).toEqual(expectedName);
      expect(activity.type).toEqual(expectedType);
      done();
    });
  });

  it("should ensure fast sync with edited activity", done => {
    // Given
    const enableFastSync = true;
    const editedActivityId = 727632286; // Lunch ride
    const newName = "NewName";
    const newType = "NewType";
    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
      return Q.resolve();
    });

    // When
    const promiseFastSync = promiseLocalActivity.then(() => {
      return activitiesSynchronize.sync(enableFastSync);
    });

    // Then
    promiseFastSync.then((syncResultModel: SyncResultModel) => {
      expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
      expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(1);
      expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

      const activity: Activity = _.find(CHROME_STORAGE_STUB.activities, {
        id: editedActivityId
      });
      expect(activity.name).toEqual(newName);
      expect(activity.type).toEqual(newType);

      done();
    });
  });

  it("should ensure fast sync with deleted activity", done => {
    // Given
    const enableFastSync = true;
    const deletedActivityId = 727632286; // Lunch ride
    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
      return Q.resolve();
    });

    // When
    const promiseFastSync = promiseLocalActivity.then(() => {
      return activitiesSynchronize.sync(enableFastSync);
    });

    // Then
    promiseFastSync.then((syncResultModel: SyncResultModel) => {
      expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
      expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
      expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(1);

      const activity: Activity = _.find(CHROME_STORAGE_STUB.activities, {
        id: deletedActivityId
      }) as Activity;
      expect(_.isEmpty(activity)).toBeTruthy();

      expect(CHROME_STORAGE_STUB.activities.length).toEqual(139);

      done();
    });
  });

  it("should ensure fast sync with added, edited and deleted activities", done => {
    // Given
    const enableFastSync = true;

    const editedActivityId = 727632286; // Lunch ride
    const newName = "FakeName1";
    const newType = "FakeType1";

    const editedActivityId2 = 722210052; // Fort saint eynard
    const newName2 = "FakeName2";
    const newType2 = "FakeType2";

    const addedActivityId = 723224273; // Bon rythme ! 33 KPH !!

    const deletedActivityId = 707356065; // Je suis un gros lent !

    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
      editStravaActivity(editedActivityId2, rawPagesOfActivities[0], newName2, newType2);
      addStravaActivity(addedActivityId);
      removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
      return Q.resolve();
    });

    // When
    const promiseFastSync = promiseLocalActivity.then(() => {
      return activitiesSynchronize.sync(enableFastSync);
    });

    // Then
    promiseFastSync.then((syncResultModel: SyncResultModel) => {
      expect(syncResultModel.activitiesChangesModel.added.length).toEqual(1);
      expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(2);
      expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(1);

      let activity: Activity = _.find(CHROME_STORAGE_STUB.activities, { id: editedActivityId });
      expect(activity.name).toEqual(newName);
      expect(activity.type).toEqual(newType);

      activity = _.find(CHROME_STORAGE_STUB.activities, { id: editedActivityId2 });
      expect(activity.name).toEqual(newName2);
      expect(activity.type).toEqual(newType2);

      activity = _.find(CHROME_STORAGE_STUB.activities, { id: addedActivityId });
      expect(activity).not.toBeNull();

      activity = _.find(CHROME_STORAGE_STUB.activities, { id: deletedActivityId });
      expect(_.isEmpty(activity)).toBeTruthy();

      done();
    });
  });

  it("should ensure fast sync with no changes", done => {
    // Given
    const enableFastSync = true;
    const promiseLocalActivity = activitiesSynchronize.sync().then(() => {
      return Q.resolve();
    });

    // When
    const promiseFastSync = promiseLocalActivity.then(() => {
      return activitiesSynchronize.sync(enableFastSync);
    });

    // Then
    promiseFastSync.then(
      (syncResultModel: SyncResultModel) => {
        expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
        expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
        expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

        expect(CHROME_STORAGE_STUB.activities.length).toEqual(140);

        done();
      },
      error => {
        expect(error).toBeNull(error);

        done();
      }
    );
  });

  afterEach(() => {
    activitiesSynchronize = null;
  });
});
