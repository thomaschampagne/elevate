import { TestBed } from "@angular/core/testing";

import { UserSettingsDao } from "./user-settings.dao";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import * as _ from "lodash";

describe("UserSettingsDao", () => {

	let userSettingsDao: UserSettingsDao;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [UserSettingsDao]
		});

		// Retrieve injected service
		userSettingsDao = TestBed.get(UserSettingsDao);
	});

	it("should be created", (done: Function) => {
		expect(userSettingsDao).toBeTruthy();
		done();
	});

	it("should update an object property at given path", (done: Function) => {

		// Given
		const sourceUserSettings = _.cloneDeep(userSettings);

		const newSpeedZones = [{from: 666, to: 999}];
		const zoneSpeedPath = "zones.speed";

		const expectedUpdatedSettings = _.cloneDeep(sourceUserSettings);
		expectedUpdatedSettings.zones.speed = newSpeedZones;

		// When
		const updatedSettings = userSettingsDao.updateNestedPropertyOf(sourceUserSettings, zoneSpeedPath, newSpeedZones);

		// Then
		expect(updatedSettings).toEqual(expectedUpdatedSettings);

		done();
	});

	it("should NOT update an object property at unknown given path", (done: Function) => {

		// Given
		const sourceUserSettings = _.cloneDeep(userSettings);

		const newSpeedZones = [{from: 666, to: 999}];
		const zoneSpeedPath = "zones.fakeZone";

		// When
		const call = () => {
			userSettingsDao.updateNestedPropertyOf(sourceUserSettings, zoneSpeedPath, newSpeedZones);
		};

		// Then
		expect(call).toThrow(new Error("Property at path 'zones.fakeZone' do not exists"));

		done();
	});

	it("should fetch user settings", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettings);

		const browserStorageSyncGetSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});

		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseFetch: Promise<UserSettingsModel> = userSettingsDao.fetch();

		// Then
		promiseFetch.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedSettings);
			expect(browserStorageSyncGetSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject on fetch user settings", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettings);
		const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";

		const browserStorageSyncGetSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});

		const chromeError: chrome.runtime.LastError = {
			message: expectedErrorMessage
		};
		const getChromeErrorSpy = spyOn(userSettingsDao, "getChromeError").and.returnValue(chromeError);

		// When
		const promiseFetch: Promise<UserSettingsModel> = userSettingsDao.fetch();

		// Then
		promiseFetch.then((result: UserSettingsModel) => {

			expect(result).toBeNull();
			done();

		}, error => {

			expect(browserStorageSyncGetSpy).toHaveBeenCalledTimes(1);
			expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
			expect(error).not.toBeNull();
			expect(error).toEqual(expectedErrorMessage);
			done();
		});
	});

	it("should get a userGender setting", (done: Function) => {

		// Given
		const key = "userGender";
		const expectedResult = "men";
		const expectedSettings = _.cloneDeep(userSettings);
		const browserStorageSyncGetSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});
		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseGet: Promise<Object> = userSettingsDao.get(key);

		// Then
		promiseGet.then((result: string) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedResult);
			expect(browserStorageSyncGetSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should get a userWeight setting", (done: Function) => {

		// Given
		const key = "userWeight";
		const expectedSettings = _.cloneDeep(userSettings);
		const expectedResult = expectedSettings.userWeight;
		const browserStorageSyncGetSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});
		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseGet: Promise<Object> = userSettingsDao.get(key);

		// Then
		promiseGet.then((result: number) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedResult);
			expect(browserStorageSyncGetSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject on get of userWeight setting", (done: Function) => {

		// Given
		const key = "userWeight";
		const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";
		const expectedSettings = _.cloneDeep(userSettings);
		const browserStorageSyncGetSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});

		const chromeError: chrome.runtime.LastError = {
			message: expectedErrorMessage
		};
		const getChromeErrorSpy = spyOn(userSettingsDao, "getChromeError").and.returnValue(chromeError);

		// When
		const promiseGet: Promise<Object> = userSettingsDao.get(key);

		// Then
		promiseGet.then((result: number) => {

			expect(result).toBeNull();
			done();

		}, error => {

			expect(browserStorageSyncGetSpy).toHaveBeenCalledTimes(1);
			expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
			expect(error).not.toBeNull();
			expect(error).toEqual(expectedErrorMessage);
			done();
		});
	});

	it("should update a user setting", (done: Function) => {

		// Given
		const keyMaxHr = "userMaxHr";
		const maxHrValue = 199;
		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.userMaxHr = maxHrValue;

		const browserStorageSyncSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({ // TODO Put spy in beforeEach
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});
		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsDao.update(keyMaxHr, maxHrValue);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.userMaxHr).toEqual(maxHrValue);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettings);
			expect(result.userMaxHr).not.toEqual(userSettings.userMaxHr);

			expect(browserStorageSyncSpy).toHaveBeenCalled();

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject on update of a user setting", (done: Function) => {

		// Given
		const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";
		const keyMaxHr = "userMaxHr";
		const maxHrValue = 199;
		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.userMaxHr = maxHrValue;

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});


		const chromeError: chrome.runtime.LastError = {
			message: expectedErrorMessage
		};
		const getChromeErrorSpy = spyOn(userSettingsDao, "getChromeError").and.returnValue(chromeError);


		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsDao.update(keyMaxHr, maxHrValue);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).toBeNull();
			done();

		}, error => {

			expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
			expect(error).not.toBeNull();
			expect(error).toEqual(expectedErrorMessage);
			done();
		});
	});

	it("should update nested user setting", (done: Function) => {

		// Given
		const zones = [{from: 666, to: 999}];
		const path = "zones.speed";

		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.zones.speed = zones;

		const browserStorageSyncSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});
		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsDao.updateNested(path, zones);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.zones.speed).toEqual(zones);
			expect(browserStorageSyncSpy).toHaveBeenCalled();

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject update of nested user setting", (done: Function) => {

		// Given
		const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";
		const zones = [{from: 666, to: 999}];
		const path = "zones.speed";

		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.zones.speed = zones;

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(expectedSettings);
			}
		});

		const chromeError: chrome.runtime.LastError = {
			message: expectedErrorMessage
		};
		const getChromeErrorSpy = spyOn(userSettingsDao, "getChromeError").and.returnValue(chromeError);

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsDao.updateNested(path, zones);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).toBeNull();
			done();

		}, error => {

			expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
			expect(error).not.toBeNull();
			expect(error).toEqual(expectedErrorMessage);
			done();
		});
	});

	it("should reset user settings", (done: Function) => {

		// Given
		const oldSettings = _.cloneDeep(userSettings);
		oldSettings.userFTP = 99;
		oldSettings.userMaxHr = 99;
		oldSettings.userRestHr = 99;
		oldSettings.userGender = "fakeGender";
		oldSettings.zones.speed = [];
		oldSettings.zones.heartRate = [];
		oldSettings.zones.power = [];
		oldSettings.zones.cyclingCadence = [];

		const browserStorageSyncSpy = spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettings);
			}
		});
		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsDao.reset();

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(userSettings);
			expect(browserStorageSyncSpy).toHaveBeenCalled();

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
