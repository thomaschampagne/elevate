import { TestBed } from "@angular/core/testing";
import { ActivityService } from "./activity.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import * as _ from "lodash";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel, Gender, SyncedActivityModel } from "@elevate/shared/models";
import { FakeSyncedActivityHelper } from "../../../fitness-trend/shared/helpers/fake-synced-activity.helper";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { userSettingsData } from "@elevate/shared/data";

describe("ActivityService", () => {

	let activityService: ActivityService = null;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);

		done();
	});

	describe("CRUD operation support", () => {

		it("should be created", (done: Function) => {
			expect(activityService).toBeTruthy();
			done();
		});

		it("should fetch activities", (done: Function) => {

			// Given
			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<SyncedActivityModel[]> = activityService.fetch();

			// Then
			promise.then((result: SyncedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
				expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save SyncedActivityModels", (done: Function) => {

			// Given
			const syncedActivityModelsToSave = _TEST_SYNCED_ACTIVITIES_;
			const saveDaoSpy = spyOn(activityService.activityDao, "save")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<SyncedActivityModel[]> = activityService.save(syncedActivityModelsToSave);

			// Then
			promise.then((result: SyncedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
				expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should clear SyncedActivityModels", (done: Function) => {

			// Given
			const removeDaoSpy = spyOn(activityService.activityDao, "clear")
				.and.returnValue(Promise.resolve(null));

			// When
			const promise: Promise<void> = activityService.clear();

			// Then
			promise.then(() => {
				expect(removeDaoSpy).toHaveBeenCalledTimes(1);
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should remove SyncedActivityModel by strava activity ids", (done: Function) => {

			// Given
			const activitiesToDelete = [
				302537043, // Chamrousse 1750
				296692980, // Fondo 100
			];

			const expectedExistingActivity = 353633586; // Venon PR 01

			spyOn(activityService.activityDao, "removeByIds")
				.and.returnValue(Promise.resolve(_.filter(_TEST_SYNCED_ACTIVITIES_, (syncedActivityModel: SyncedActivityModel) => {
				return (_.indexOf(activitiesToDelete, syncedActivityModel.id) === -1);
			})));

			// When
			const promise: Promise<SyncedActivityModel[]> = activityService.removeByIds(activitiesToDelete);

			// Then
			promise.then((result: SyncedActivityModel[]) => {

				expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length - activitiesToDelete.length);

				let activity = _.find(result, {id: activitiesToDelete[0]});
				expect(_.isEmpty(activity)).toBeTruthy();

				activity = _.find(result, {id: activitiesToDelete[1]});
				expect(_.isEmpty(activity)).toBeTruthy();

				activity = _.find(result, {id: expectedExistingActivity});
				expect(_.isEmpty(activity)).toBeFalsy();

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

	});

	describe("Activity compliance with athlete settings", () => {

		it("should resolve activities compliant with athlete settings hasDatedAthleteSettings=false", (done: Function) => {

			// Given
			const athleteModel = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
				athleteModel,
				"SuperHeartRateRide 01",
				"Ride",
				"2018-01-01",
				150,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
				athleteModel,
				"SuperHeartRateRide 02",
				"Ride",
				"2018-01-15",
				180,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
				athleteModel,
				"SuperHeartRateRide 03",
				"Ride",
				"2018-01-30",
				135,
				null,
				false));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			const userSettingsModel = _.cloneDeep(userSettingsData);
			userSettingsModel.hasDatedAthleteSettings = false;
			userSettingsModel.athleteModel = _.cloneDeep(athleteModel);
			spyOn(activityService.athleteModelResolverService.userSettingsService, "fetch")
				.and.returnValue(Promise.resolve(userSettingsModel));
			spyOn(activityService.athleteModelResolverService.datedAthleteSettingsService, "fetch")
				.and.returnValue(Promise.resolve([]));

			// When
			const promise = activityService.isAthleteSettingsConsistent();

			// Then
			promise.then((result: boolean) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(result).toBeTruthy();
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should resolve activities compliant with athlete settings hasDatedAthleteSettings=true", (done: Function) => {

			// Given
			const athleteModel01 = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));

			const athleteModel02 = _.cloneDeep(athleteModel01);
			athleteModel02.athleteSettings.maxHr = 211;
			athleteModel02.athleteSettings.restHr = 66;
			athleteModel02.athleteSettings.cyclingFtp = 250;

			const datedAthleteSettingsModels = [
				new DatedAthleteSettingsModel("2018-01-14", athleteModel02.athleteSettings),
				new DatedAthleteSettingsModel(null, athleteModel01.athleteSettings),
			];

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
				athleteModel01,
				"SuperHeartRateRide 01",
				"Ride",
				"2018-01-01",
				150,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
				athleteModel02,
				"SuperHeartRateRide 02",
				"Ride",
				"2018-01-15",
				180,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
				athleteModel02,
				"SuperHeartRateRide 03",
				"Ride",
				"2018-01-30",
				135,
				null,
				false));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			const userSettingsModel = _.cloneDeep(userSettingsData);
			userSettingsModel.hasDatedAthleteSettings = true;
			userSettingsModel.athleteModel = _.cloneDeep(athleteModel01);
			spyOn(activityService.athleteModelResolverService.userSettingsService, "fetch")
				.and.returnValue(Promise.resolve(userSettingsModel));
			spyOn(activityService.athleteModelResolverService.datedAthleteSettingsService, "fetch")
				.and.returnValue(Promise.resolve(datedAthleteSettingsModels));

			// When
			const promise = activityService.isAthleteSettingsConsistent();

			// Then
			promise.then((result: boolean) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(result).toBeTruthy();
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should resolve non consistent activities ids which are not compliant athlete settings hasDatedAthleteSettings=true", (done: Function) => {

			// Given
			const athleteModel01 = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));

			const athleteModel02 = _.cloneDeep(athleteModel01);
			athleteModel02.athleteSettings.maxHr = 211;
			athleteModel02.athleteSettings.restHr = 66;
			athleteModel02.athleteSettings.cyclingFtp = 250;

			const datedAthleteSettingsModels = [
				new DatedAthleteSettingsModel("2018-01-15", athleteModel02.athleteSettings),
				new DatedAthleteSettingsModel(null, athleteModel01.athleteSettings),
			];

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
				athleteModel01,
				"SuperHeartRateRide 01",
				"Ride",
				"2018-01-01",
				150,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
				athleteModel01,
				"SuperHeartRateRide 02",
				"Ride",
				"2018-01-15",
				180,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
				athleteModel01,
				"SuperHeartRateRide 03",
				"Ride",
				"2018-01-30",
				135,
				null,
				false));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			const userSettingsModel = _.cloneDeep(userSettingsData);
			userSettingsModel.hasDatedAthleteSettings = true;
			userSettingsModel.athleteModel = _.cloneDeep(athleteModel01);
			spyOn(activityService.athleteModelResolverService.userSettingsService, "fetch")
				.and.returnValue(Promise.resolve(userSettingsModel));
			spyOn(activityService.athleteModelResolverService.datedAthleteSettingsService, "fetch")
				.and.returnValue(Promise.resolve(datedAthleteSettingsModels));

			// When
			const promise = activityService.nonConsistentActivitiesWithAthleteSettings();

			// Then
			promise.then((result: number[]) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				expect(_.indexOf(result, 1)).toEqual(-1);
				expect(_.indexOf(result, 2)).not.toEqual(-1);
				expect(_.indexOf(result, 3)).not.toEqual(-1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should resolve activities NOT compliant with athlete settings", (done: Function) => {

			// Given
			const athleteModel = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
				athleteModel,
				"SuperHeartRateRide 01",
				"Ride",
				"2018-01-01",
				150,
				null,
				false));

			const variousAthleteModel = _.cloneDeep(athleteModel);
			variousAthleteModel.athleteSettings.maxHr = 666; // Introducing a little settings change
			syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
				variousAthleteModel,
				"SuperHeartRateRide 02",
				"Ride",
				"2018-01-15",
				180,
				null,
				false));

			syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
				athleteModel,
				"SuperHeartRateRide 03",
				"Ride",
				"2018-01-30",
				135,
				null,
				false));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			const userSettingsModel = _.cloneDeep(userSettingsData);
			userSettingsModel.hasDatedAthleteSettings = false;
			userSettingsModel.athleteModel = _.cloneDeep(athleteModel);
			spyOn(activityService.athleteModelResolverService.userSettingsService, "fetch")
				.and.returnValue(Promise.resolve(userSettingsModel));
			spyOn(activityService.athleteModelResolverService.datedAthleteSettingsService, "fetch")
				.and.returnValue(Promise.resolve([]));

			// When
			const promise = activityService.isAthleteSettingsConsistent();

			// Then
			promise.then((result: boolean) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(result).toBeFalsy();
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

	});

});
