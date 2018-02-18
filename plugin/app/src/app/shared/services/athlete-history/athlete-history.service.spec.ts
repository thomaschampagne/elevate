import { inject, TestBed } from "@angular/core/testing";
import { AthleteHistoryDao } from "../../dao/athlete-history/athlete-history.dao";
import { AthleteHistoryService } from "./athlete-history.service";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { AthleteHistoryModel } from "./athlete-history.model";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { AthleteHistoryState } from "./athlete-history-state.enum";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";

describe("AthleteHistoryService", () => {

	const tabId = 101;
	let athleteHistoryService: AthleteHistoryService;
	let athleteHistoryDao: AthleteHistoryDao;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [AthleteHistoryService, AthleteHistoryDao, ActivityDao, UserSettingsService, UserSettingsDao]
		});

		athleteHistoryService = TestBed.get(AthleteHistoryService);
		athleteHistoryDao = TestBed.get(AthleteHistoryDao);

		spyOn(athleteHistoryService, "getCurrentTab").and.callFake((callback: (tab: chrome.tabs.Tab) => void) => {
			const tab: Partial<chrome.tabs.Tab> = {
				id: tabId
			};
			callback(tab as chrome.tabs.Tab);
		});

		spyOn(athleteHistoryService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettings));

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

	});

	it("should be created", inject([AthleteHistoryService], (service: AthleteHistoryService) => {
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
		const expectedLastSyncDateTime = 666;
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
		const expectedLastSyncDateTime = 9999;

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

	it("should remove athlete profile (for history remove)", (done: Function) => {

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

	it("should remove last sync date time (for history remove)", (done: Function) => {

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

	it("should prepare export athlete history", (done: Function) => {

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

		const lastSyncDateTime = 99;
		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(expectedAthleteProfileModel);
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
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

	it("should export athlete history", (done: Function) => {

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

		const lastSyncDateTime = 99;

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(athleteHistoryService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(athleteHistoryService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = athleteHistoryService.export();

		// Then
		promise.then(() => {

			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(1);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not export athlete history without last sync date", (done: Function) => {

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

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(null);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(athleteHistoryService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(athleteHistoryService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = athleteHistoryService.export();

		// Then
		promise.then(() => {

			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(0);
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Cannot export. No last synchronization date found.");
			done();
		});

	});

	it("should not export athlete history without profile", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(null);
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(athleteHistoryService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(athleteHistoryService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = athleteHistoryService.export();

		// Then
		promise.then(() => {

			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(0);
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Cannot export. No athlete history profile saved.");
			done();
		});

	});

	it("should import athlete history", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const version = "1.0.0";

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
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve(null));

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

	it("should not import athlete history with mismatch version", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "6.6.6";
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

	it("should not import athlete history with no version provided (=null)", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: AthleteHistoryModel = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: null
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

	it("should not import athlete history with no version provided (missing key)", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: Partial<AthleteHistoryModel> = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime
		};

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(athleteHistoryModelImported.lastSyncDateTime));
		spyOn(athleteHistoryService.athleteHistoryDao, "saveProfile").and.returnValue(Promise.resolve(athleteHistoryModelImported.syncWithAthleteProfile));
		spyOn(athleteHistoryService.activityDao, "save").and.returnValue(Promise.resolve(athleteHistoryModelImported.computedActivities));
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.import(athleteHistoryModelImported as AthleteHistoryModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete history with no athlete profile", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Athlete profile is not defined in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: Partial<AthleteHistoryModel> = {
			computedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(athleteHistoryModelImported.lastSyncDateTime));
		spyOn(athleteHistoryService.activityDao, "save").and.returnValue(Promise.resolve(athleteHistoryModelImported.computedActivities));
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.import(athleteHistoryModelImported as AthleteHistoryModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete history with synced activities empty (=null)", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: AthleteHistoryModel = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: null,
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

	it("should not import athlete history with synced activities empty (missing key)", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: Partial<AthleteHistoryModel> = {
			syncWithAthleteProfile: athleteProfileModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(athleteHistoryService.athleteHistoryDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(athleteHistoryModelImported.lastSyncDateTime));
		spyOn(athleteHistoryService.athleteHistoryDao, "saveProfile").and.returnValue(Promise.resolve(athleteHistoryModelImported.syncWithAthleteProfile));
		spyOn(athleteHistoryService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.import(athleteHistoryModelImported as AthleteHistoryModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete history with synced activities empty (length == 0)", (done: Function) => {

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

		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const athleteHistoryModelImported: AthleteHistoryModel = {
			syncWithAthleteProfile: athleteProfileModel,
			computedActivities: [],
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

	it("should remove athlete history", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve(null));

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

	it("should reject on remove history failure (removeLastSyncDateTime not deleted)", (done: Function) => {

		// Given
		spyOn(athleteHistoryService.athleteHistoryDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(99));
		spyOn(athleteHistoryService.athleteHistoryDao, "removeProfile").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "remove").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<AthleteHistoryModel> = athleteHistoryService.remove();

		// Then
		promise.then((athleteHistoryModel: AthleteHistoryModel) => {
			expect(athleteHistoryModel).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Athlete history has not been deleted totally. Some properties cannot be deleted. You may need to uninstall/install the software.");
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

	it("should provide NOT_SYNCED state", (done: Function) => {

		// Given
		const expectedState = AthleteHistoryState.NOT_SYNCED;
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<AthleteHistoryState> = athleteHistoryService.getSyncState();

		// Then
		promise.then((athleteHistoryState: AthleteHistoryState) => {
			expect(athleteHistoryState).toEqual(expectedState);
			done();
		});
	});

	it("should provide PARTIALLY_SYNCED state", (done: Function) => {

		// Given
		const expectedState = AthleteHistoryState.PARTIALLY_SYNCED;
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<AthleteHistoryState> = athleteHistoryService.getSyncState();

		// Then
		promise.then((athleteHistoryState: AthleteHistoryState) => {
			expect(athleteHistoryState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (1)", (done: Function) => {

		// Given
		const expectedState = AthleteHistoryState.SYNCED;
		const lastSyncDateTime = 9999;
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(lastSyncDateTime));
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<AthleteHistoryState> = athleteHistoryService.getSyncState();

		// Then
		promise.then((athleteHistoryState: AthleteHistoryState) => {
			expect(athleteHistoryState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (2)", (done: Function) => {

		// Given
		const expectedState = AthleteHistoryState.SYNCED;
		const lastSyncDateTime = 9999;
		spyOn(athleteHistoryService.athleteHistoryDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(lastSyncDateTime));
		spyOn(athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<AthleteHistoryState> = athleteHistoryService.getSyncState();

		// Then
		promise.then((athleteHistoryState: AthleteHistoryState) => {
			expect(athleteHistoryState).toEqual(expectedState);
			done();
		});
	});

	it("should provide equality between local athlete profile & remote", (done: Function) => {

		// Given
		const expected = true;
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const localAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const remoteAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(localAthleteProfileModel));

		// When
		const promise: Promise<boolean> = athleteHistoryService.isLocalRemoteAthleteProfileSame(remoteAthleteProfileModel);

		// Then
		promise.then((same: boolean) => {

			expect(same).toEqual(expected);
			done();
		});

	});

	it("should provide mismatch between local athlete profile & remote", (done: Function) => {

		// Given
		const expected = false;
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const localAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		const remoteAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight + 1); // Inject difference

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(localAthleteProfileModel));

		// When
		const promise: Promise<boolean> = athleteHistoryService.isLocalRemoteAthleteProfileSame(remoteAthleteProfileModel);

		// Then
		promise.then((same: boolean) => {

			expect(same).toEqual(expected);
			done();
		});
	});


	it("should reject if no local athlete profile found", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const remoteAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight); // Inject difference

		spyOn(athleteHistoryService.athleteHistoryDao, "getProfile").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<boolean> = athleteHistoryService.isLocalRemoteAthleteProfileSame(remoteAthleteProfileModel);

		// Then
		promise.then((same: boolean) => {

			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		}, error => {
			expect(error).not.toBeNull();
			expect(error).toEqual("Local athlete history do not exist.");
			done();
		});

	});

});
