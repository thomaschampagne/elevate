import { TestBed } from "@angular/core/testing";
import { UserSettingsService } from "./user-settings.service";
import { UserSettingsModel, UserZonesModel, ZoneModel } from "@elevate/shared/models";
import { userSettingsData } from "@elevate/shared/data";
import * as _ from "lodash";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { SharedModule } from "../../shared.module";
import { CoreModule } from "../../../core/core.module";

describe("UserSettingsService", () => {

	let userSettingsService: UserSettingsService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
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


	it("should save user setting property", (done: Function) => {

		// Given
		const key = "displayAdvancedHrData";
		const displayAdvancedHrData = false;
		const expectedSettings: UserSettingsModel = _.cloneDeep(userSettingsData);
		expectedSettings.displayAdvancedHrData = displayAdvancedHrData;

		const savePropertyDaoSpy = spyOn(userSettingsService.userSettingsDao, "upsertProperty")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.saveProperty<boolean>(key, displayAdvancedHrData);

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.displayAdvancedHrData).toEqual(displayAdvancedHrData);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettingsData);
			expect(result.displayAdvancedHrData).not.toEqual(userSettingsData.displayAdvancedHrData);
			expect(savePropertyDaoSpy).toHaveBeenCalledTimes(1);
			expect(savePropertyDaoSpy).toHaveBeenCalledWith(key, displayAdvancedHrData);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save a nested user setting property", (done: Function) => {

		// Given
		const path: string[] = ["athleteModel", "athleteSettings", "lthr", "default"];
		const value = 175;
		const expectedSettings: UserSettingsModel = _.cloneDeep(userSettingsData);
		expectedSettings.athleteModel.athleteSettings.lthr.default = value;

		const savedNestedDaoSpy = spyOn(userSettingsService.userSettingsDao, "upsertProperty")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseSave: Promise<UserSettingsModel> = userSettingsService.saveProperty(path, value);

		// Then
		promiseSave.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result.athleteModel.athleteSettings.lthr.default).toEqual(value);
			expect(result).toEqual(expectedSettings);
			expect(result).not.toEqual(userSettingsData);
			expect(result.athleteModel.athleteSettings.lthr.default).not.toEqual(userSettingsData.athleteModel.athleteSettings.lthr.default);
			expect(savedNestedDaoSpy).toHaveBeenCalledTimes(1);
			expect(savedNestedDaoSpy).toHaveBeenCalledWith(path, value);

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

		const savePropertyDaoSpy = spyOn(userSettingsService.userSettingsDao, "upsertProperty")
			.and.returnValue(Promise.resolve(expectedSettings));

		// When
		const promiseClearLS: Promise<void> = userSettingsService.clearLocalStorageOnNextLoad();

		// Then
		promiseClearLS.then(() => {
			expect(savePropertyDaoSpy).toHaveBeenCalledTimes(1);
			expect(savePropertyDaoSpy).toHaveBeenCalledWith(UserSettingsService.MARK_LOCAL_STORAGE_CLEAR, true);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save user zone", (done: Function) => {

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
		const serializedZones = UserZonesModel.serialize(TO_BE_SAVED_ZONES);
		settings.zones.speed = serializedZones;

		const upsertNestedPropertyDaoSpy = spyOn(userSettingsService.userSettingsDao, "upsertProperty")
			.and.returnValue(Promise.resolve(settings));

		// When
		const promiseUpdateZones: Promise<ZoneModel[]> = userSettingsService.saveZones(zoneDefinition, TO_BE_SAVED_ZONES);

		// Then
		promiseUpdateZones.then((savedZones: ZoneModel[]) => {

			expect(savedZones).not.toBeNull();
			expect(savedZones).toEqual(TO_BE_SAVED_ZONES);
			expect(upsertNestedPropertyDaoSpy).toHaveBeenCalledTimes(1);
			expect(upsertNestedPropertyDaoSpy).toHaveBeenCalledWith(["zones", "speed"], serializedZones);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reset user settings", (done: Function) => {

		// Given
		const saveDaoSpy = spyOn(userSettingsService.userSettingsDao, "save")
			.and.returnValue(Promise.resolve(userSettingsData));


		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.reset();

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(userSettingsData);
			expect(saveDaoSpy).toHaveBeenCalledTimes(1);
			expect(saveDaoSpy).toHaveBeenCalledWith(userSettingsData);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reset user zones settings", (done: Function) => {

		// Given
		const upsertPropertyDao = spyOn(userSettingsService.userSettingsDao, "upsertProperty")
			.and.returnValue(Promise.resolve(userSettingsData));


		// When
		const promiseUpdate: Promise<UserSettingsModel> = userSettingsService.resetZones();

		// Then
		promiseUpdate.then((result: UserSettingsModel) => {

			expect(result).not.toBeNull();
			expect(upsertPropertyDao).toHaveBeenCalledTimes(1);
			expect(upsertPropertyDao).toHaveBeenCalledWith(["zones"], userSettingsData.zones);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
