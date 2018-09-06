import * as _ from "lodash";
import * as Q from "q";
import * as $ from "jquery";
import { editActivityFromArray, removeActivityFromArray } from "../tools/SpecsTools";
import { UserSettingsModel } from "../../scripts/shared/models/user-settings/user-settings.model";
import { AppResourcesModel } from "../../scripts/models/app-resources.model";
import { ActivitiesSynchronizer } from "../../scripts/models/sync/ActivitiesSynchronizer";
import { StravaActivityModel } from "../../scripts/models/sync/strava-activity.model";
import { StreamActivityModel } from "../../scripts/models/sync/stream-activity.model";
import { AnalysisDataModel } from "../../scripts/models/activity-data/analysis-data.model";
import { SyncedActivityModel } from "../../scripts/shared/models/sync/synced-activity.model";
import { MultipleActivityProcessor } from "../../scripts/processors/MultipleActivityProcessor";
import { SyncNotifyModel } from "../../scripts/models/sync/sync-notify.model";
import { SyncResultModel } from "../../scripts/shared/models/sync/sync-result.model";
import { ActivitiesChangesModel } from "../../scripts/models/sync/activities-changes.model";
import { AthleteModelResolver } from "../../scripts/shared/resolvers/athlete-model.resolver";
import { userSettingsData } from "../../scripts/shared/user-settings.data";
import { DatedAthleteSettingsModel } from "../../../app/src/app/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import { AthleteSettingsModel } from "../../../app/src/app/shared/models/athlete/athlete-settings/athlete-settings.model";

describe("ActivitiesSynchronizer", () => {

	let athleteModelResolver: AthleteModelResolver;
	let userSettingsMock: UserSettingsModel;
	let appResourcesMock: AppResourcesModel;
	let activitiesSynchronizer: ActivitiesSynchronizer;
	let rawPagesOfActivities: Array<{ models: Array<StravaActivityModel>, total: number }>;
	let CHROME_STORAGE_STUB: { // Fake stubed storage to simulate chrome local storage
		syncedActivities?: SyncedActivityModel[],
		lastSyncDateTime?: number
	};

	/**
	 *
	 * @param id
	 */
	const addStravaActivity = (activityId: number) => {
		if (_.find(CHROME_STORAGE_STUB.syncedActivities, {id: activityId})) {
			CHROME_STORAGE_STUB.syncedActivities = removeActivityFromArray(activityId, CHROME_STORAGE_STUB.syncedActivities);
			return true;
		} else {
			return false;
		}
	};

	/**
	 *
	 * @param activityId
	 * @param rawPageOfActivities
	 * @param newName
	 * @param newType
	 * @returns {boolean}
	 */
	const editStravaActivity = (activityId: number, rawPageOfActivities: any, newName: string, newType: string) => {
		const found = _.find(rawPageOfActivities.models, {id: activityId});
		if (found) {
			rawPageOfActivities.models = editActivityFromArray(activityId, rawPageOfActivities.models, newName, newType);
			return true;
		} else {
			return false;
		}
	};

	/**
	 *
	 * @param id
	 * @param atPage
	 */
	const removeStravaActivity = (activityId: number, rawPageOfActivities: any) => {
		const found = _.find(rawPageOfActivities.models, {id: activityId});
		if (found) {
			rawPageOfActivities.models = removeActivityFromArray(activityId, rawPageOfActivities.models);
			return true;
		} else {
			return false;
		}
	};

	beforeEach(() => {

		CHROME_STORAGE_STUB = {}; // Reset storage

		userSettingsMock = _.cloneDeep(userSettingsData);
		appResourcesMock = _.cloneDeep(require("../fixtures/appResources/appResources.json"));

		// We have 7 pages
		rawPagesOfActivities = [
			_.cloneDeep(require("../fixtures/sync/rawPage0120161213.json")), // Page 01 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0220161213.json")), // Page 02 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0320161213.json")), // Page 03 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0420161213.json")), // Page 04 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0520161213.json")), // Page 05 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0620161213.json")), // Page 06 - 20 ACT
			_.cloneDeep(require("../fixtures/sync/rawPage0720161213.json")), // Page 07 - 20 ACT
		];

		// Setup athlete models resolution
		userSettingsMock.hasDatedAthleteSettings = true;

		const datedAthleteSettingsModels = [
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, 325, 32, 78))
		];
		athleteModelResolver = new AthleteModelResolver(userSettingsMock, datedAthleteSettingsModels);

		activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock, athleteModelResolver);

		/**
		 * Stubing http calls to strava training pages
		 */
		spyOn(activitiesSynchronizer, "httpPageGet").and.callFake((perPage: number, page: number) => {
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
				defer.resolve({models: []}, "success"); // No models to give
			}
			return defer.promise();
		});

		/**
		 * Stubing activity stream promised, reduce @ 50 samples
		 */
		const stream: any = _.cloneDeep(require("../fixtures/activities/723224273/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false

		spyOn(activitiesSynchronizer, "fetchStreamByActivityId").and.callFake((activityId: number) => {
			const defer = Q.defer();
			const data: any = {};
			_.forEach(_.keys(stream), (key: string) => {
				data[key] = stream[key].slice(0, 50);
			});
			data.activityId = activityId;
			defer.notify(activityId);
			defer.resolve(data);
			return defer.promise;
		});

		/**
		 * Stub MultipleActivityProcessor:compute. Create fake analysis results
		 */
		spyOn(activitiesSynchronizer.multipleActivityProcessor, "compute").and.callFake((activitiesWithStream: Array<StreamActivityModel>) => {
			const defer = Q.defer();
			console.log("Spy activitiesSynchronizer.multipleActivityProcessor:compute called");
			const activitiesComputed: Array<SyncedActivityModel> = [];
			const fakeAnalysisData: AnalysisDataModel = {
				moveRatio: null,
				speedData: null,
				paceData: null,
				powerData: null,
				heartRateData: null,
				cadenceData: null,
				gradeData: null,
				elevationData: null,
			};
			_.forEach(activitiesWithStream, (awStream: StreamActivityModel) => {
				const activityComputed: SyncedActivityModel = <SyncedActivityModel> _.pick(awStream, MultipleActivityProcessor.outputFields);
				activityComputed.extendedStats = fakeAnalysisData;
				activitiesComputed.push(activityComputed);
			});
			defer.resolve(activitiesComputed);
			return defer.promise;
		});

		/**
		 * Stub:
		 * - saveSyncedActivitiesToLocal
		 * - getSyncedActivitiesFromLocal
		 * - saveLastSyncDateToLocal
		 * - getLastSyncDateFromLocal
		 * - clearSyncCache
		 */
		spyOn(activitiesSynchronizer, "saveSyncedActivitiesToLocal").and.callFake((syncedActivities: Array<SyncedActivityModel>) => {
			const defer = Q.defer();
			CHROME_STORAGE_STUB.syncedActivities = syncedActivities;
			defer.resolve({
				data: CHROME_STORAGE_STUB
			});
			return defer.promise;
		});

		spyOn(activitiesSynchronizer, "getSyncedActivitiesFromLocal").and.callFake(() => {
			const defer = Q.defer();
			defer.resolve({
				data: CHROME_STORAGE_STUB.syncedActivities
			});
			return defer.promise;
		});

		spyOn(activitiesSynchronizer, "saveLastSyncDateToLocal").and.callFake((timestamp: number) => {
			const defer = Q.defer();
			CHROME_STORAGE_STUB.lastSyncDateTime = timestamp;
			defer.resolve({
				data: CHROME_STORAGE_STUB
			});
			return defer.promise;
		});

		spyOn(activitiesSynchronizer, "getLastSyncDateFromLocal").and.callFake(() => {
			const defer = Q.defer();
			defer.resolve({
				data: (CHROME_STORAGE_STUB.lastSyncDateTime) ? CHROME_STORAGE_STUB.lastSyncDateTime : null
			});
			return defer.promise;
		});

		spyOn(activitiesSynchronizer, "clearSyncCache").and.callFake(() => {
			const defer = Q.defer();
			CHROME_STORAGE_STUB = {}; // Remove all
			defer.resolve();
			return defer.promise;
		});

	});

	it("should ensure ActivitiesSynchronizer:getFirstPageRemoteActivities()", (done: Function) => {

		// Given
		const expectedCount = 140;
		const expectedFirstPageModelCount = 20;

		// When
		const remoteActivitiesCount = activitiesSynchronizer.getFirstPageRemoteActivities();

		// Then
		remoteActivitiesCount.then((result: { activitiesCountAllPages: number, firstPageModels: StravaActivityModel[] }) => {
			expect(result.firstPageModels.length).toEqual(expectedFirstPageModelCount);
			expect(result.activitiesCountAllPages).toEqual(expectedCount);
			done();

		}, (err: any) => {
			expect(err).toBeNull();
			done();
		}, (progress: SyncNotifyModel) => {
			console.log(progress);
		});
	});

	it("should ensure ActivitiesSynchronizer:fetchRawActivitiesRecursive()", (done: Function) => {

		// Give NO last sync date or page + page to read.
		activitiesSynchronizer.fetchRawActivitiesRecursive(null).then((rawStravaActivities: Array<StravaActivityModel>) => {

			expect(activitiesSynchronizer.httpPageGet).toHaveBeenCalled(); // Ensure spy call

			expect(rawStravaActivities).not.toBeNull();
			expect(rawStravaActivities.length).toEqual(20 * 7); // 140 > 7 pages

			const jeannieRide: StravaActivityModel = _.find(rawStravaActivities, {id: 718908064}); // Find in page 1
			expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
			expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
			expect(jeannieRide.moving_time_raw).toEqual(8557);

			const relaxRide: StravaActivityModel = _.find(rawStravaActivities, {id: 642780978}); // Find in page 1
			expect(relaxRide.name).toEqual("Relax");
			expect(relaxRide.moving_time_raw).toEqual(4888);

			const burnedRide: StravaActivityModel = _.find(rawStravaActivities, {id: 377239233}); // Find in page 1
			expect(burnedRide.name).toEqual("Cramé !!");
			expect(burnedRide.type).toEqual("Ride");
			expect(burnedRide.moving_time_raw).toEqual(4315);

			const fakeRide: StravaActivityModel = _.find(rawStravaActivities, {id: 9999999999}); // Find in page 1
			expect(fakeRide).toBeUndefined();
			return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 1, 3);

		}).then((rawStravaActivities: Array<StravaActivityModel>) => {
			// expect(activitiesSynchronizer.endReached).toBeFalsy();
			expect(rawStravaActivities.length).toEqual(20 * 3);
			return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 3); // Can only read page 6 + 7

		}).then((rawStravaActivities: Array<StravaActivityModel>) => {
			// expect(activitiesSynchronizer.endReached).toBeTruthy();
			expect(rawStravaActivities.length).toEqual(40); // Page 6 + 7
			return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 1);

		}).then((rawStravaActivities: Array<StravaActivityModel>) => {
			// expect(activitiesSynchronizer.endReached).toBeFalsy();
			expect(rawStravaActivities.length).toEqual(20);
			done();

		}, (err: any) => {
			expect(err).toBeNull();
			done();
		}, (progress: SyncNotifyModel) => {
			console.log(progress);
		});
	});

	it("should ensure ActivitiesSynchronizer:fetchWithStream()", (done: Function) => {

		// let fromPage = 1, pagesToRead = 3; // read 1 => 3
		activitiesSynchronizer.fetchWithStream(null, null, null).then((activitiesWithStream: Array<StreamActivityModel>) => {

			expect(activitiesSynchronizer.fetchStreamByActivityId).toHaveBeenCalled(); // Ensure spy call

			expect(activitiesWithStream).not.toBeNull();
			expect(activitiesWithStream.length).toEqual(140);

			const jeannieRide: StreamActivityModel = _.find(activitiesWithStream, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
			expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
			expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
			expect(jeannieRide.moving_time_raw).toEqual(8557);
			expect(jeannieRide.stream).not.toBeNull();

			const fakeRide: StreamActivityModel = _.find(activitiesWithStream, {id: 9999999999}); // Find fake
			expect(fakeRide).toBeUndefined();

			// Now fetch in pages 4 to 6
			return activitiesSynchronizer.fetchWithStream(null, 4, 3);

		}).then((activitiesWithStream: Array<StreamActivityModel>) => {

			// Testing activitiesSynchronizer.fetchWithStream(null, 4, 3); => pages 4 to 6
			expect(activitiesWithStream).not.toBeNull();
			expect(activitiesWithStream.length).toEqual(60);
			const jeannieRide: StreamActivityModel = _.find(activitiesWithStream, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
			expect(jeannieRide).toBeUndefined(); // Must not exists in pages 4 to 6

			done(); // Finish it !

		}, (err: any) => {
			expect(err).toBeNull();
			done();
		}, (progress: SyncNotifyModel) => {
			console.log(progress);
		});

	});

	it("should ensure ActivitiesSynchronizer:fetchAndComputeGroupOfPages()", (done: Function) => {

		// Getting all pages (7)
		activitiesSynchronizer.fetchAndComputeGroupOfPages(null, null, null).then((activitiesComputed: Array<SyncedActivityModel>) => {

			expect(activitiesSynchronizer.multipleActivityProcessor.compute).toHaveBeenCalled(); // Ensure spy call
			expect(activitiesComputed).not.toBeNull();
			expect(activitiesComputed.length).toEqual(140);

			expect(_.first(activitiesComputed).extendedStats).toBeDefined();
			expect(_.first(activitiesComputed).extendedStats.heartRateData).toBeNull();
			expect(_.first(activitiesComputed).extendedStats.speedData).toBeNull();

			// Now fetch in pages 7 to 10 (only 7 exists...)
			return activitiesSynchronizer.fetchAndComputeGroupOfPages(null, 7, 3);

		}).then((activitiesComputed: Array<SyncedActivityModel>) => {

			// result of pages 7 to 10 (only 7 exists...)
			expect(activitiesComputed.length).toEqual(20); // Only 20 results... not 60 !

			const ride: SyncedActivityModel = _.find(activitiesComputed, {id: 406217194}); // Find "Afternoon Ride"
			expect(ride.extendedStats).toBeDefined();
			expect(ride.extendedStats.heartRateData).toBeNull();
			expect(ride.extendedStats.speedData).toBeNull();
			expect(ride.moving_time_raw).toEqual(5901);

			const jeannieRide: SyncedActivityModel = _.find(activitiesComputed, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
			expect(jeannieRide).toBeUndefined(); // Must not exists in page 7

			done();
		});
	});

	it("should ensure ActivitiesSynchronizer:computeActivitiesByGroupsOfPages() all pages", (done: Function) => {

		expect(activitiesSynchronizer).not.toBeNull();
		expect(activitiesSynchronizer).not.toBeUndefined();
		expect(activitiesSynchronizer.computeActivitiesByGroupsOfPages).not.toBeUndefined();

		// Getting all pages here:
		activitiesSynchronizer.computeActivitiesByGroupsOfPages(null).then((mergedSyncedActivities: Array<SyncedActivityModel>) => {

			expect(activitiesSynchronizer.getSyncedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
			expect(activitiesSynchronizer.saveSyncedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call

			expect(mergedSyncedActivities).not.toBeNull();
			expect(mergedSyncedActivities.length).toEqual(140);

			const jeannieRide: SyncedActivityModel = _.find(mergedSyncedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
			expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
			expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
			expect(jeannieRide.moving_time_raw).toEqual(8557);
			expect(jeannieRide.extendedStats).not.toBeNull();
			expect(jeannieRide.extendedStats.heartRateData).toBeNull();
			expect(jeannieRide.extendedStats.speedData).toBeNull();

			const fakeRide: SyncedActivityModel = _.find(mergedSyncedActivities, {id: 9999999999}); // Find fake
			expect(fakeRide).toBeUndefined();

			expect(activitiesSynchronizer.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

			done();
		});
	});

	it("should sync() when no existing stored synced activities", (done: Function) => {

		expect(activitiesSynchronizer.hasBeenSyncedActivities).toBeNull(); // No mergedSyncedActivities at the moment

		activitiesSynchronizer.getLastSyncDateFromLocal().then((savedLastSyncDateTime: any) => {
			// Check no last sync date
			expect(_.isNull(savedLastSyncDateTime.data) || _.isUndefined(savedLastSyncDateTime.data)).toBeTruthy();
			return activitiesSynchronizer.getSyncedActivitiesFromLocal();
		}).then((syncedActivitiesStored: any) => {
			// Check no syncedActivitiesStored
			expect(_.isNull(syncedActivitiesStored.data) || _.isUndefined(syncedActivitiesStored.data)).toBeTruthy();
			return activitiesSynchronizer.sync(); // Start sync
		}).then((syncResult: SyncResultModel) => {

			// Sync finished
			expect(activitiesSynchronizer.getSyncedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
			expect(activitiesSynchronizer.saveSyncedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call
			expect(activitiesSynchronizer.getLastSyncDateFromLocal).toHaveBeenCalledTimes(2); // Ensure spy call
			expect(activitiesSynchronizer.saveLastSyncDateToLocal).toHaveBeenCalledTimes(1); // Ensure spy call

			expect(syncResult.syncedActivities).not.toBeNull();
			expect(syncResult.syncedActivities.length).toEqual(140);

			const jeannieRide: SyncedActivityModel = _.find(syncResult.syncedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
			expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
			expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
			expect(jeannieRide.moving_time_raw).toEqual(8557);
			expect(jeannieRide.extendedStats).not.toBeNull();
			expect(jeannieRide.extendedStats.heartRateData).toBeNull();
			expect(jeannieRide.extendedStats.speedData).toBeNull();

			const fakeRide: SyncedActivityModel = _.find(syncResult.syncedActivities, {id: 9999999999}); // Find fake
			expect(fakeRide).toBeUndefined();

			expect(activitiesSynchronizer.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

			// Check lastSyncDate & syncedAthleteProfile
			return activitiesSynchronizer.getLastSyncDateFromLocal();

		}).then((savedLastSyncDateTime: any) => {

			expect(CHROME_STORAGE_STUB.lastSyncDateTime).not.toBeNull();
			expect(_.isNumber(CHROME_STORAGE_STUB.lastSyncDateTime)).toBeTruthy();
			expect(savedLastSyncDateTime.data).not.toBeNull();
			expect(_.isNumber(savedLastSyncDateTime.data)).toBeTruthy();

			done();

		}, (err: any) => {

			expect(err).toBeNull();
			done();
		}, (progress: SyncNotifyModel) => {

		});
	});

	it("should sync() when a new today training came up + an old one", (done: Function) => {

		expect(CHROME_STORAGE_STUB.syncedActivities).toBeUndefined();
		expect(CHROME_STORAGE_STUB.lastSyncDateTime).toBeUndefined();

		// Get a full sync, with nothing stored...
		// On sync done simulate 2 new added activities on strava.com
		// Re-sync and test...
		activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(syncResult.syncedActivities.length).toEqual(CHROME_STORAGE_STUB.syncedActivities.length);

			// Add a new trainings on strava.com
			expect(addStravaActivity(799672885)).toBeTruthy(); // Add "Running back... Hard" - page 01 (removing it from last storage)
			expect(addStravaActivity(644365059)).toBeTruthy(); // Add "Sortie avec vik" - page 02 (removing it from last storage)
			expect(addStravaActivity(371317512)).toBeTruthy(); // Add "Fast Fast Fast Pschitt" - page 07 (removing it from last storage)

			// We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(syncResult.syncedActivities.length - 3);
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 799672885})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 644365059})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 371317512})).toBeUndefined();

			expect(activitiesSynchronizer.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			expect(syncResult.activitiesChangesModel.added.length).toEqual(3);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(syncResult.syncedActivities.length);

			// We should found "Running back... Hard" act anymore in storage
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 799672885})).toBeDefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 644365059})).toBeDefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 371317512})).toBeDefined();

			done();
		});
	});

	it("should sync() when a training has been upload today to but perform 2 weeks ago, then test added first and last", (done: Function) => {

		// Get a full sync, with nothing stored...
		// On sync done simulate 1 new added 2 weeks ago
		// Re-sync and test...
		activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(syncResult.syncedActivities.length).toEqual(CHROME_STORAGE_STUB.syncedActivities.length);

			// Add a new trainings on strava.com
			expect(addStravaActivity(657225503)).toBeTruthy(); // Add "xxxx" - page 01 (removing it from last storage)

			// We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(syncResult.syncedActivities.length - 1);
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 657225503})).toBeUndefined();

			expect(activitiesSynchronizer.hasBeenSyncedActivities).not.toBeNull(); // Keep tracking of merged activities instance

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(1);
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 657225503})).toBeDefined();

			// Now remove first activity and last...
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 799672885})).toBeDefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 367463594})).toBeDefined();

			expect(addStravaActivity(799672885)).toBeTruthy();
			expect(addStravaActivity(367463594)).toBeTruthy();

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(138); // 140 - 2
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 799672885})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 367463594})).toBeUndefined();

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(2); // must be 2
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 799672885})).toBeDefined(); // must be defined!
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 367463594})).toBeDefined(); // must be defined!
			done();
		}, (err: any) => {
			console.log("!! ERROR !!", err); // Error...
			done();
		}, (progress: SyncNotifyModel) => {
			// computeProgress...
			// deferred.notify(progress);
		});
	});

	it("should sync() when 2 activities been edited from strava.com", (done: Function) => {

		// Get a full sync, with nothing stored...
		// On sync done simulate ...
		// Re-sync and test...
		activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(editStravaActivity(9999999, rawPagesOfActivities[0], "FakeName", "FakeType")).toBeFalsy(); // Fake one, nothing should be edited
			expect(editStravaActivity(707356065, rawPagesOfActivities[0], "Prends donc un velo!", "Ride")).toBeTruthy(); // Page 1, "Je suis un gros lent !"
			expect(editStravaActivity(427606185, rawPagesOfActivities[5], "First Zwift", "VirtualRide")).toBeTruthy(); // Page 6, "1st zwift ride"

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities).not.toBeNull();
			expect(syncResult.syncedActivities.length).toEqual(140);

			expect(syncResult.activitiesChangesModel.added.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(2);

			// Check return
			let ride: SyncedActivityModel = _.find(syncResult.syncedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
			expect(ride.name).toEqual("Prends donc un velo!");
			expect(ride.type).toEqual("Ride");
			expect(ride.display_type).toEqual("Ride");

			let virtualRide: SyncedActivityModel = _.find(syncResult.syncedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
			expect(virtualRide.name).toEqual("First Zwift");
			expect(virtualRide.type).toEqual("VirtualRide");
			expect(virtualRide.display_type).toEqual("VirtualRide");

			// Check in stub
			ride = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
			expect(ride.name).toEqual("Prends donc un velo!");
			expect(ride.type).toEqual("Ride");
			expect(ride.display_type).toEqual("Ride");

			virtualRide = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
			expect(virtualRide.name).toEqual("First Zwift");
			expect(virtualRide.type).toEqual("VirtualRide");
			expect(virtualRide.display_type).toEqual("VirtualRide");

			done();
		}, (err: any) => {
			console.log("!! ERROR !!", err); // Error...
			done();
		}, (progress: SyncNotifyModel) => {
			// computeProgress...
			// deferred.notify(progress);
		});

	});

	it("should sync() when 3 activities have been removed from strava.com", (done: Function) => {

		// Get a full sync, with nothing stored...
		// On sync done simulate ...
		// Re-sync and test...
		activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			expect(removeStravaActivity(9999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
			expect(removeStravaActivity(707356065, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Je suis un gros lent !"
			expect(removeStravaActivity(427606185, rawPagesOfActivities[5])).toBeTruthy(); // Page 6, "1st zwift ride"

			expect(_.find(rawPagesOfActivities[0].models, {id: 707356065})).toBeUndefined();
			expect(_.find(rawPagesOfActivities[5].models, {id: 427606185})).toBeUndefined();
			expect(_.find(rawPagesOfActivities[5].models, {id: 424565561})).toBeDefined(); // Should still exists

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(138); // -2 deleted
			expect(syncResult.syncedActivities.length).toEqual(138); // -2 deleted

			expect(syncResult.activitiesChangesModel.added.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(2);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			// Check returns
			const ride: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
			expect(ride).toBeUndefined();

			const virtualRide: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
			expect(virtualRide).toBeUndefined();

			const anotherRide: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 424565561}); // Should still exists
			expect(anotherRide).toBeDefined();

			done();

		}, (err: any) => {
			console.log("!! ERROR !!", err); // Error...
			done();
		}, (progress: SyncNotifyModel) => {
			// computeProgress...
			// deferred.notify(progress);
		});

	});

	it("should sync() when added/edited/deleted from strava.com in the same sync", (done: Function) => {

		// Get a full sync, with nothing stored...
		// On sync done simulate ...
		// Re-sync and test...
		activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {

			// Sync is done...
			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);
			expect(syncResult.syncedActivities.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.added.length).toEqual(140);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(0);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(0);

			/**
			 * Add 3 on various pages
			 */
			expect(addStravaActivity(723224273)).toBeTruthy(); // "Bon rythme ! 33 KPH !!"
			expect(addStravaActivity(556443499)).toBeTruthy(); // "75k @ 31.5 KPH // 181 BPM"
			expect(addStravaActivity(368210547)).toBeTruthy(); // "Natation"

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(137); // 140 - 3
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 723224273})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 556443499})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 368210547})).toBeUndefined();
			expect(_.find(CHROME_STORAGE_STUB.syncedActivities, <any> {id: 367463594})).toBeDefined(); // Should exists. Not removed from CHROME_STORAGE_STUB.syncedActivities

			/**
			 * Edit 4 on various pages
			 */
			expect(editStravaActivity(999999999, rawPagesOfActivities[0], "FakeName", "FakeType")).toBeFalsy(); // Fake one, nothing should be edited
			expect(editStravaActivity(707356065, rawPagesOfActivities[0], "Prends donc un velo!", "Ride")).toBeTruthy(); // Page 1, "Je suis un gros lent !"
			expect(editStravaActivity(569640952, rawPagesOfActivities[2], "Petit nez!", "Ride")).toBeTruthy(); // Page 3, "Pinet"
			expect(editStravaActivity(427606185, rawPagesOfActivities[5], "First Zwift", "VirtualRide")).toBeTruthy(); // Page 6, "1st zwift ride"
			expect(editStravaActivity(372761597, rawPagesOfActivities[6], "Rodage plaquettes new name", "EBike")).toBeTruthy(); // Page 7, "Rodage plaquettes"

			expect(_.find(rawPagesOfActivities[2].models, {id: 569640952}).name).toEqual("Petit nez!");
			expect(_.find(rawPagesOfActivities[6].models, {id: 372761597}).type).toEqual("EBike");
			expect(_.find(rawPagesOfActivities[0].models, {id: 707356065}).type).not.toEqual("EBike");

			/**
			 * Delete 5 on various pages
			 */
			expect(removeStravaActivity(999999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
			expect(removeStravaActivity(661113141, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Reprise apr\u00e8s vacances"
			expect(removeStravaActivity(566288762, rawPagesOfActivities[2])).toBeTruthy(); // Page 3, "Tranquille "
			expect(removeStravaActivity(552562511, rawPagesOfActivities[3])).toBeTruthy(); // Page 4, "Pererree 1.4"
			expect(removeStravaActivity(473894759, rawPagesOfActivities[4])).toBeTruthy(); // Page 5, "Zwift Watopia Easy Spin Flat"
			expect(removeStravaActivity(406217194, rawPagesOfActivities[6])).toBeTruthy(); // Page 7, "Afternoon Ride"

			expect(_.find(rawPagesOfActivities[0].models, {id: 661113141})).toBeUndefined(); // Page 1, "Reprise apr\u00e8s vacances"
			expect(_.find(rawPagesOfActivities[2].models, {id: 566288762})).toBeUndefined(); // Page 3, "Tranquille "
			expect(_.find(rawPagesOfActivities[3].models, {id: 552562511})).toBeUndefined(); // Page 4, "Pererree 1.4"
			expect(_.find(rawPagesOfActivities[4].models, {id: 473894759})).toBeUndefined(); // Page 5, "Zwift Watopia Easy Spin Flat"
			expect(_.find(rawPagesOfActivities[6].models, {id: 406217194})).toBeUndefined(); // Page 7, "Afternoon Ride"
			expect(_.find(rawPagesOfActivities[5].models, {id: 424565561})).toBeDefined(); // Should still exists "Chartreuse Rousse et Herbe fluo !!"

			// Ready for a new sync
			return activitiesSynchronizer.sync();

		}).then((syncResult: SyncResultModel) => {

			expect(CHROME_STORAGE_STUB.syncedActivities).not.toBeNull();
			expect(syncResult.syncedActivities).not.toBeNull();
			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(135); // -5 deleted
			expect(syncResult.syncedActivities.length).toEqual(135); // -5 deleted

			expect(syncResult.activitiesChangesModel.added.length).toEqual(3);
			expect(syncResult.activitiesChangesModel.deleted.length).toEqual(5);
			expect(syncResult.activitiesChangesModel.edited.length).toEqual(4);

			// Check some edited
			let activity: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 707356065});
			expect(activity.name).toEqual("Prends donc un velo!");
			expect(activity.type).toEqual("Ride");
			expect(activity.display_type).toEqual("Ride");

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 372761597});
			expect(activity.name).toEqual("Rodage plaquettes new name");
			expect(activity.type).toEqual("EBike");
			expect(activity.display_type).toEqual("EBike");

			// Check some added
			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 723224273});
			expect(activity.name).toEqual("Bon rythme ! 33 KPH !!");
			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 556443499});
			expect(activity.name).toEqual("75k @ 31.5 KPH // 181 BPM");

			// Check some deleted
			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 566288762});
			expect(activity).toBeUndefined();

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 473894759});
			expect(activity).toBeUndefined();

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: 424565561});
			expect(activity).toBeDefined(); // Should still exists

			done();
		});

	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() reject when no local activities", (done: Function) => {

		// Given, When
		const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();

		// Then
		hasMissMatchPromise.then(() => {
			expect(false).toBeTruthy("Should not be here !");
			done();
		}, error => {
			expect(error).not.toBeNull();
			done();
		});
	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect remote added activity", (done: Function) => {

		// Given
		const newStravaActivityId = 799672885;
		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then((syncResult: SyncResultModel) => {
			addStravaActivity(newStravaActivityId); // New strava activity "Running back... Hard"
			return Q.resolve();
		});

		// When
		promiseLocalSyncedActivity.then(() => {

			const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
			hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
				expect(result.hasMisMatch).toBeTruthy();
				expect(result.activitiesChangesModel.added.length).toEqual(1);
				expect(result.activitiesChangesModel.edited.length).toEqual(0);
				expect(result.activitiesChangesModel.deleted.length).toEqual(0);
				done();
			});

		});

	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect no remote added activity", (done: Function) => {

		// Given
		const promiseSynced = activitiesSynchronizer.sync();

		// When
		const hasMissMatchPromise = promiseSynced.then(() => {
			return activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
		});

		// Then
		hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
			expect(result.hasMisMatch).toBeFalsy();
			expect(result.activitiesChangesModel.added.length).toEqual(0);
			expect(result.activitiesChangesModel.edited.length).toEqual(0);
			expect(result.activitiesChangesModel.deleted.length).toEqual(0);
			done();
		});
	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited activity", (done: Function) => {

		// Given
		const editedActivityId = 727632286; // Lunch ride
		const newName = "NewName";
		const newType = "NewType";

		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
			return Q.resolve();
		});

		// When
		promiseLocalSyncedActivity.then(() => {

			const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
			hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
				expect(result.hasMisMatch).toBeTruthy();
				expect(result.activitiesChangesModel.added.length).toEqual(0);
				expect(result.activitiesChangesModel.edited.length).toEqual(1);
				expect(result.activitiesChangesModel.deleted.length).toEqual(0);
				done();
			});

		});
	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote deleted activity", (done: Function) => {

		// Given
		const deletedActivityId = 727632286; // Lunch ride

		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
			return Q.resolve();
		});

		// When
		promiseLocalSyncedActivity.then(() => {

			const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
			hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
				expect(result.hasMisMatch).toBeTruthy();
				expect(result.activitiesChangesModel.added.length).toEqual(0);
				expect(result.activitiesChangesModel.edited.length).toEqual(0);
				expect(result.activitiesChangesModel.deleted.length).toEqual(1);
				done();
			});

		});
	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited and added activity", (done: Function) => {

		// Given
		const editedActivityId = 727632286; // Lunch ride
		const editedActivityId2 = 722210052; // Fort saint eynard
		const addedActivityId = 723224273; // Bon rythme ! 33 KPH !!
		const deletedActivityId = 707356065; // Je suis un gros lent !

		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			editStravaActivity(editedActivityId, rawPagesOfActivities[0], "Fake", "Fake");
			editStravaActivity(editedActivityId2, rawPagesOfActivities[0], "Fake", "Fake");
			addStravaActivity(addedActivityId);
			removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
			return Q.resolve();
		});

		// When
		promiseLocalSyncedActivity.then(() => {

			const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
			hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
				expect(result.hasMisMatch).toBeTruthy();
				expect(result.activitiesChangesModel.added.length).toEqual(1);
				expect(result.activitiesChangesModel.edited.length).toEqual(2);
				expect(result.activitiesChangesModel.deleted.length).toEqual(1);
				done();
			});

		});
	});

	it("should ensure hasRemoteFirstPageActivitiesMismatch() detect a remote edited, added activity and deleted activity", (done: Function) => {

		// Given
		const editedActivityId = 727632286; // Lunch ride
		const editedActivityId2 = 722210052; // Fort saint eynard
		const addedActivityId = 723224273; // Bon rythme ! 33 KPH !!

		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			editStravaActivity(editedActivityId, rawPagesOfActivities[0], "Fake", "Fake");
			editStravaActivity(editedActivityId2, rawPagesOfActivities[0], "Fake", "Fake");
			addStravaActivity(addedActivityId);
			return Q.resolve();
		});

		// When
		promiseLocalSyncedActivity.then(() => {

			const hasMissMatchPromise = activitiesSynchronizer.hasRemoteFirstPageActivitiesMismatch();
			hasMissMatchPromise.then((result: { hasMisMatch: boolean, activitiesChangesModel: ActivitiesChangesModel }) => {
				expect(result.hasMisMatch).toBeTruthy();
				expect(result.activitiesChangesModel.added.length).toEqual(1);
				expect(result.activitiesChangesModel.edited.length).toEqual(2);
				expect(result.activitiesChangesModel.deleted.length).toEqual(0);
				done();
			});

		});
	});

	it("should ensure fast sync with added activity", (done: Function) => {

		// Given
		const enableFastSync = true;
		const addedStravaActivityId = 727632286; // Lunch ride
		const expectedName = "Lunch Ride";
		const expectedType = "Ride";
		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			addStravaActivity(addedStravaActivityId);
			return Q.resolve();
		});

		// When
		const promiseFastSync = promiseLocalSyncedActivity.then(() => {
			return activitiesSynchronizer.sync(enableFastSync);
		});

		// Then
		promiseFastSync.then((syncResultModel: SyncResultModel) => {
			expect(syncResultModel.activitiesChangesModel.added.length).toEqual(1);
			expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

			const activity: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: addedStravaActivityId});
			expect(activity.name).toEqual(expectedName);
			expect(activity.type).toEqual(expectedType);
			done();
		});
	});

	it("should ensure fast sync with edited activity", (done: Function) => {

		// Given
		const enableFastSync = true;
		const editedActivityId = 727632286; // Lunch ride
		const newName = "NewName";
		const newType = "NewType";
		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
			return Q.resolve();
		});

		// When
		const promiseFastSync = promiseLocalSyncedActivity.then(() => {
			return activitiesSynchronizer.sync(enableFastSync);
		});

		// Then
		promiseFastSync.then((syncResultModel: SyncResultModel) => {

			expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(1);
			expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

			const activity: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: editedActivityId});
			expect(activity.name).toEqual(newName);
			expect(activity.type).toEqual(newType);
			expect(activity.display_type).toEqual(newType);

			done();
		});
	});

	it("should ensure fast sync with deleted activity", (done: Function) => {

		// Given
		const enableFastSync = true;
		const deletedActivityId = 727632286; // Lunch ride
		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
			return Q.resolve();
		});

		// When
		const promiseFastSync = promiseLocalSyncedActivity.then(() => {
			return activitiesSynchronizer.sync(enableFastSync);
		});

		// Then
		promiseFastSync.then((syncResultModel: SyncResultModel) => {

			expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(1);

			const activity: SyncedActivityModel = <SyncedActivityModel> _.find(CHROME_STORAGE_STUB.syncedActivities, {id: deletedActivityId});
			expect(_.isEmpty(activity)).toBeTruthy();

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(139);

			done();
		});
	});

	it("should ensure fast sync with added, edited and deleted activities", (done: Function) => {

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

		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			editStravaActivity(editedActivityId, rawPagesOfActivities[0], newName, newType);
			editStravaActivity(editedActivityId2, rawPagesOfActivities[0], newName2, newType2);
			addStravaActivity(addedActivityId);
			removeStravaActivity(deletedActivityId, rawPagesOfActivities[0]);
			return Q.resolve();
		});

		// When
		const promiseFastSync = promiseLocalSyncedActivity.then(() => {
			return activitiesSynchronizer.sync(enableFastSync);
		});

		// Then
		promiseFastSync.then((syncResultModel: SyncResultModel) => {

			expect(syncResultModel.activitiesChangesModel.added.length).toEqual(1);
			expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(2);
			expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(1);

			let activity: SyncedActivityModel = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: editedActivityId});
			expect(activity.name).toEqual(newName);
			expect(activity.type).toEqual(newType);
			expect(activity.display_type).toEqual(newType);

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: editedActivityId2});
			expect(activity.name).toEqual(newName2);
			expect(activity.type).toEqual(newType2);
			expect(activity.display_type).toEqual(newType2);

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: addedActivityId});
			expect(activity).not.toBeNull();

			activity = _.find(CHROME_STORAGE_STUB.syncedActivities, {id: deletedActivityId});
			expect(_.isEmpty(activity)).toBeTruthy();

			done();
		});

	});

	it("should ensure fast sync with no changes", (done: Function) => {

		// Given
		const enableFastSync = true;
		const promiseLocalSyncedActivity = activitiesSynchronizer.sync().then(() => {
			return Q.resolve();
		});

		// When
		const promiseFastSync = promiseLocalSyncedActivity.then(() => {
			return activitiesSynchronizer.sync(enableFastSync);
		});

		// Then
		promiseFastSync.then((syncResultModel: SyncResultModel) => {
			expect(syncResultModel.activitiesChangesModel.added.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.edited.length).toEqual(0);
			expect(syncResultModel.activitiesChangesModel.deleted.length).toEqual(0);

			expect(CHROME_STORAGE_STUB.syncedActivities.length).toEqual(140);

			done();
		}, error => {

			expect(error).toBeNull(error);

			done();
		});
	});

	afterEach(() => {
		activitiesSynchronizer = null;
	});

});
