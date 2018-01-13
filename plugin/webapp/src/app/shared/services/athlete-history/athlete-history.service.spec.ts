import { inject, TestBed } from '@angular/core/testing';
import { AthleteHistoryDao } from "../../dao/athlete-history/athlete-history.dao";
import { AthleteHistoryService } from "./athlete-history.service";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { AthleteHistoryModel } from "./athlete-history.model";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { NotImplementedException } from "../../exceptions/not-implemented.exception";

describe('AthleteHistoryService', () => {

	const tabId: number = 101;
	let athleteHistoryService: AthleteHistoryService;
	let athleteHistoryDao: AthleteHistoryDao;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [AthleteHistoryService, AthleteHistoryDao, ActivityDao]
		});

		athleteHistoryService = TestBed.get(AthleteHistoryService);
		athleteHistoryDao = TestBed.get(AthleteHistoryDao);

		spyOn(athleteHistoryService, "getCurrentTab").and.callFake((callback: (tab: chrome.tabs.Tab) => void) => {
			const tab: Partial<chrome.tabs.Tab> = {
				id: tabId
			};
			callback(tab as chrome.tabs.Tab);
		});

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

	});

	it('should be created', inject([AthleteHistoryService], (service: AthleteHistoryService) => {
		expect(service).toBeTruthy();
	}));

	it("should get athlete profile", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const expectedAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryService.getProfile();

		// Then
		promise.then((profileModel: AthleteProfileModel) => {

			expect(profileModel).not.toBeNull();
			expect(profileModel).toEqual(expectedAthleteProfileModel);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime: number = 666;
		spyOn(athleteHistoryDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = athleteHistoryService.getLastSyncDateTime();

		// Then
		promise.then((lastSyncDateTime: number) => {

			expect(lastSyncDateTime).not.toBeNull();
			expect(lastSyncDateTime).toEqual(expectedLastSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save athlete profile (for history import)", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const athleteProfileModelToSave: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryService.athleteHistoryDao, "saveProfile").and.returnValue(Promise.resolve(athleteProfileModelToSave));

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryService.saveProfile(athleteProfileModelToSave);

		// Then
		promise.then((savedAthleteProfileModel: AthleteProfileModel) => {

			expect(savedAthleteProfileModel).not.toBeNull();
			expect(savedAthleteProfileModel).toEqual(athleteProfileModelToSave);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save last sync date time (for history import)", (done: Function) => {

		// Given
		const expectedLastSyncDateTime: number = 9999;

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = athleteHistoryService.saveLastSyncDateTime(expectedLastSyncDateTime);

		// Then
		promise.then((lastSyncDateTime: number) => {

			expect(lastSyncDateTime).not.toBeNull();
			expect(lastSyncDateTime).toEqual(expectedLastSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});


	});

	it("should clear athlete profile (for history clear)", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryService.removeProfile();

		// Then
		promise.then((result: AthleteProfileModel) => {

			expect(result).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should clear last sync date time (for history clear)", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<number> = athleteHistoryService.removeLastSyncDateTime();

		// Then
		promise.then((result: number) => {

			expect(result).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare export history", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const expectedAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const lastSyncDateTime: number = 99;
		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(expectedAthleteProfileModel);
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version: string = "1.0.0";
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.prepareForExport();

		// Then
		promise.then((athleteHistoryModel: AthleteHistoryModel) => {

			expect(athleteHistoryModel).not.toBeNull();
			expect(athleteHistoryModel.pluginVersion).toEqual(version);
			expect(athleteHistoryModel.lastSyncDateTime).toEqual(lastSyncDateTime);
			expect(athleteHistoryModel.computedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
			expect(athleteHistoryModel.syncWithAthleteProfile).toEqual(expectedAthleteProfileModel);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should export history", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const expectedAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const lastSyncDateTime: number = 99;

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(expectedAthleteProfileModel);
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version: string = "1.0.0";
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(athleteHistoryService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(athleteHistoryService, "saveAs").and.stub();

		// When
		athleteHistoryService.export(() => {

			// Then
			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(1);
			done();
		});

	});

	it("should not export history without last sync date", (done: Function) => {
		throw new NotImplementedException();
	});

	it("should not export history without profile", (done: Function) => {
		throw new NotImplementedException();
	});

	it("should not export history without synced activities", (done: Function) => {
		throw new NotImplementedException();
	});

	it("should import history", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const athleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const lastSyncDateTime: number = 99;
		const version: string = "1.0.0";

		const athleteHistoryModelImported: AthleteHistoryModel = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: version
		};

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(athleteHistoryModelImported.lastSyncDateTime));
		spyOn(athleteHistoryService.athleteHistoryDao, "saveProfile").and.returnValue(Promise.resolve(athleteHistoryModelImported.syncWithAthleteProfile));
		spyOn(athleteHistoryService.activityDao, "save").and.returnValue(Promise.resolve(athleteHistoryModelImported.computedActivities));
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve([]));

		const athleteHistoryRemoveSpy = spyOn(athleteHistoryService, "remove").and.callThrough();

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.import(athleteHistoryModelImported);
		// Then
		promise.then((athleteHistoryModel: AthleteHistoryModel) => {

			expect(athleteHistoryRemoveSpy).toHaveBeenCalledTimes(1);

			expect(athleteHistoryModel).not.toBeNull();
			expect(athleteHistoryModel.pluginVersion).toEqual(athleteHistoryModelImported.pluginVersion);
			expect(athleteHistoryModel.lastSyncDateTime).toEqual(athleteHistoryModelImported.lastSyncDateTime);
			expect(athleteHistoryModel.computedActivities).toEqual(athleteHistoryModelImported.computedActivities);
			expect(athleteHistoryModel.syncWithAthleteProfile).toEqual(athleteHistoryModelImported.syncWithAthleteProfile);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not import history with mismatch version", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const athleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const lastSyncDateTime: number = 99;
		const currentInstalledVersion: string = "1.0.0";
		const importedVersion: string = "6.6.6";
		const expectedErrorMessage = "Cannot import history because of plugin version mismatch. " +
			"The installed plugin version is " + currentInstalledVersion + " and imported backup file is " +
			"for a " + importedVersion + " plugin version. Try perform a clean full sync.";

		const athleteHistoryModelImported: AthleteHistoryModel = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(athleteHistoryModelImported.lastSyncDateTime));
		spyOn(athleteHistoryService.athleteHistoryDao, "saveProfile").and.returnValue(Promise.resolve(athleteHistoryModelImported.syncWithAthleteProfile));
		spyOn(athleteHistoryService.activityDao, "save").and.returnValue(Promise.resolve(athleteHistoryModelImported.computedActivities));
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.import(athleteHistoryModelImported);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should clear history", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve([]));

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.remove();

		// Then
		promise.then((athleteHistoryModel: AthleteHistoryModel) => {
			expect(athleteHistoryModel).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not clear history", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(99));
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve([]));

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.remove();

		// Then
		promise.then((athleteHistoryModel: AthleteHistoryModel) => {
			expect(athleteHistoryModel).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Athlete history model has not been deleted totally. Some properties cannot be deleted.");
			done();
		});

	});

	it("should open sync window", (done: Function) => {

		// Given
		const forceSync = false;
		const expectedUrl = "https://www.strava.com/dashboard?stravistixSync=true&forceSync=" + forceSync + "&sourceTabId=" + tabId;

		// When
		athleteHistoryService.sync(forceSync);

		// Then
		expect(athleteHistoryService.getCurrentTab).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalledWith(expectedUrl, jasmine.any(String), jasmine.any(String));

		done();
	});
});
