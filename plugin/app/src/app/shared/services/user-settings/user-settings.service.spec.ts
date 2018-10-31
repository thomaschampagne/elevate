import { TestBed } from "@angular/core/testing";
import { UserSettingsService } from "./user-settings.service";
import { UserSettingsModel } from "../../../../../../shared/models/user-settings/user-settings.model";
import { userSettingsData } from "../../../../../../shared/user-settings.data";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { ZoneModel } from "../../../../../../shared/models/zone.model";
import { Gender } from "../../models/athlete/gender.enum";
import { UserZonesModel } from "../../../../../../shared/models/user-settings/user-zones.model";

describe("UserSettingsService", () => {

	let userSettingsService: UserSettingsService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [UserSettingsService, UserSettingsDao]
		});

		// Retrieve injected service
		userSettingsService = TestBed.get(UserSettingsService);
		done();
	});

	it("should be created", (done: Function) => {
		expect(userSettingsService).toBeTruthy();
		done();
	});

	it("should fetch user settings", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettingsData);
		const fetchDaoSpy = spyOn(userSettingsService.userSettingsDao, "fetch")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseFetch: Promise<UserSettingsModel> = userSettingsService.fetch();

		// Then
		promiseFetch.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedSettings);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should get temperatureUnit key", (done: Function) => {

		// Given
		const key = "temperatureUnit";
		const expectedSettings = userSettingsData.temperatureUnit;
		const getDaoSpy = spyOn(userSettingsService.userSettingsDao, "get")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseGet: Promise<Object> = userSettingsService.get(key);

		// Then
		promiseGet.then((result: Object) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedSettings);
			expect(getDaoSpy).toHaveBeenCalledTimes(1);
			expect(getDaoSpy).toHaveBeenCalledWith(key);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should update a user setting", (done: Function) => {

		// Given
		const key = "displayAdvancedHrData";
		const displayAdvancedHrData = false;
		const expectedSettings = _.cloneDeep(userSettingsData);
		expectedSettings.displayAdvancedHrData = displayAdvancedHrData;

		const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.update(key, displayAdvancedHrData);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.displayAdvancedHrData).toEqual(displayAdvancedHrData);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettingsData);
			expect(result.displayAdvancedHrData).not.toEqual(userSettingsData.displayAdvancedHrData);
			expect(updateDaoSpy).toHaveBeenCalledTimes(1);
			expect(updateDaoSpy).toHaveBeenCalledWith(key, displayAdvancedHrData);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should update a user nested setting", (done: Function) => {

		// Given
		const path = "athleteModel.athleteSettings.lthr.default";
		const value = 175;
		const expectedSettings = _.cloneDeep(userSettingsData);
		expectedSettings.athleteModel.athleteSettings.lthr.default = value;

		const updateNestedDaoSpy = spyOn(userSettingsService.userSettingsDao, "updateNested")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.updateNested(path, value);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.athleteModel.athleteSettings.lthr.default).toEqual(value);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettingsData);
			expect(result.athleteModel.athleteSettings.lthr.default).not.toEqual(userSettingsData.athleteModel.athleteSettings.lthr.default);
			expect(updateNestedDaoSpy).toHaveBeenCalledTimes(1);
			expect(updateNestedDaoSpy).toHaveBeenCalledWith(path, value);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should mark local storage to be clear", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettingsData);
		expectedSettings.localStorageMustBeCleared = true;

		const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseClearLS: Promise<void> = userSettingsService.clearLocalStorageOnNextLoad();

		// Then
		promiseClearLS.then(() => {
			expect(updateDaoSpy).toHaveBeenCalledTimes(1);
			expect(updateDaoSpy).toHaveBeenCalledWith(UserSettingsService.MARK_LOCAL_STORAGE_CLEAR, true);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should update a user zone", (done: Function) => {

		// Given
		const TO_BE_SAVED_ZONES = [ // 8 zones
			{from: 0, to: 50},
			{from: 50, to: 100},
			{from: 100, to: 150},
			{from: 150, to: 200},
			{from: 200, to: 250},
			{from: 250, to: 300},
			{from: 300, to: 400},
			{from: 400, to: 500}
		];

		const zoneDefinition: ZoneDefinitionModel = {
			name: "Cycling Speed",
			value: "speed",
			units: "KPH",
			step: 0.1,
			min: 0,
			max: 9999,
			customDisplay: null
		};

		const settings = _.cloneDeep(userSettingsData);
		settings.zones.speed = UserZonesModel.serialize(TO_BE_SAVED_ZONES);

		const updateNestedDaoSpy = spyOn(userSettingsService.userSettingsDao, "updateNested")
			.and.returnValue(Promise.resolve(settings));

		// When
		const promiseUpdateZones: Promise<ZoneModel[]> = userSettingsService.updateZones(zoneDefinition, TO_BE_SAVED_ZONES);

		// Then
		promiseUpdateZones.then((savedZones: ZoneModel[]) => {

			expect(savedZones).not.toBeNull();
			expect(savedZones).toEqual(TO_BE_SAVED_ZONES);
			expect(updateNestedDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reset user settings", (done: Function) => {

		// Given
		const oldSettings = _.cloneDeep(userSettingsData);
		oldSettings.displayAdvancedHrData = true;
		oldSettings.athleteModel.gender = Gender.WOMEN;
		oldSettings.zones.speed = [];
		oldSettings.zones.heartRate = [];
		oldSettings.zones.power = [];
		oldSettings.zones.cyclingCadence = [];

		spyOn(userSettingsService.userSettingsDao, "reset").and.returnValue(Promise.resolve(userSettingsData));

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.reset();

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(userSettingsData);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
