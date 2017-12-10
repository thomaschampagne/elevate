import {TestBed} from "@angular/core/testing";
import {UserSettingsService} from "./user-settings.service";
import {IUserSettings} from "../../../../../../common/scripts/interfaces/IUserSettings";
import {userSettings} from "../../../../../../common/scripts/UserSettings";
import {UserSettingsDao} from "../../dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import {IZone} from "../../../../../../common/scripts/interfaces/IActivityData";
import {ZoneDefinitionModel} from "../../models/zone-definition.model";

describe("UserSettingsService", () => {

	let userSettingsService: UserSettingsService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [UserSettingsService, UserSettingsDao]
		});

		// Retrieve injected service
		userSettingsService = TestBed.get(UserSettingsService);

	});

	it("should be created", (done: Function) => {
		expect(userSettingsService).toBeTruthy();
		done();
	});

	it("should fetch user settings", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettings);
		const fetchDaoSpy = spyOn(userSettingsService.userSettingsDao, "fetch")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseFetch: Promise<IUserSettings> = userSettingsService.fetch();

		// Then
		promiseFetch.then((result: IUserSettings) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedSettings);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should get user settings key", (done: Function) => {

		// Given
		const key = "userGender";
		const expectedSettings = userSettings.userGender;
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
		const keyMaxHr = "userMaxHr";
		const maxHrValue = 199;
		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.userMaxHr = maxHrValue;

		const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseUpdate: Promise<IUserSettings> = userSettingsService.update(keyMaxHr, maxHrValue);

		// Then
		promiseUpdate.then((result: IUserSettings) => {

			expect(result).not.toBeNull();
			expect(result.userMaxHr).toEqual(maxHrValue);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettings);
			expect(result.userMaxHr).not.toEqual(userSettings.userMaxHr);
			expect(updateDaoSpy).toHaveBeenCalledTimes(1);
			expect(updateDaoSpy).toHaveBeenCalledWith(keyMaxHr, maxHrValue);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should mark local storage to be clear", (done: Function) => {

		// Given
		const expectedSettings = _.cloneDeep(userSettings);
		expectedSettings.localStorageMustBeCleared = true;

		const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseClearLS: Promise<IUserSettings> = userSettingsService.markLocalStorageClear();

		// Then
		promiseClearLS.then((result: IUserSettings) => {

			expect(result.localStorageMustBeCleared).toEqual(true);
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

		const EXISTING_STORED_SPEED_ZONES_MOCKED: IZone[] = [
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50}
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

		const settings = _.cloneDeep(userSettings);
		settings.zones.speed = TO_BE_SAVED_ZONES;

		const updateNestedDaoSpy = spyOn(userSettingsService.userSettingsDao, "updateNested")
			.and.returnValue(Promise.resolve(settings));

		// When
		const promiseUpdateZones: Promise<IZone[]> = userSettingsService.updateZones(zoneDefinition, TO_BE_SAVED_ZONES);

		// Then
		promiseUpdateZones.then((savedZones: IZone[]) => {

			expect(savedZones).not.toBeNull();
			expect(savedZones).toEqual(TO_BE_SAVED_ZONES);
			expect(updateNestedDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

});
