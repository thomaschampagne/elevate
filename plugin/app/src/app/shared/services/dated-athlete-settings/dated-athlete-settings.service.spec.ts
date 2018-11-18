import { TestBed } from "@angular/core/testing";
import { DatedAthleteSettingsService } from "./dated-athlete-settings.service";
import { AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { DatedAthleteSettingsDao } from "../../dao/dated-athlete-settings/dated-athlete-settings.dao";
import { AppError } from "../../models/app-error.model";
import { MockedDataStore } from "../../data-store/impl/spec/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";

describe("DatedAthleteSettingsService", () => {

	let service: DatedAthleteSettingsService = null;

	let since;
	let until;
	let maxHr;
	let restHr;
	let lthr;
	let cyclingFTP;
	let runningFTP;
	let swimFTP;
	let weight;
	let mockedDataStore: MockedDataStore<DatedAthleteSettingsModel>;

	beforeEach((done: Function) => {

		mockedDataStore = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				DatedAthleteSettingsService,
				DatedAthleteSettingsDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		service = TestBed.get(DatedAthleteSettingsService);

		since = new Date();
		until = new Date();
		maxHr = 200;
		restHr = 50;
		lthr = {
			default: 185,
			cycling: null,
			running: null
		};
		cyclingFTP = 210;
		runningFTP = 350;
		swimFTP = 31;
		weight = 72;
		done();
	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});

	describe("should fetch", () => {

		it("should fetch and sort descending existing 'dated athlete settings'", (done: Function) => {

			// Given
			const expectedApsModel_03 = new DatedAthleteSettingsModel("2018-06-01", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const expectedApsModel_02 = new DatedAthleteSettingsModel("2018-02-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const expectedApsModel_01 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				expectedApsModel_03,
				expectedApsModel_01, // Introduce not sorted period between 01/02
				expectedApsModel_02, // Introduce not sorted period between 01/02
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				expect(result[0]).toEqual(expectedApsModel_03);
				expect(result[1]).toEqual(expectedApsModel_02);
				expect(result[2]).toEqual(expectedApsModel_01);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should fetch empty 'dated athlete settings'", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(result).toEqual(existingPeriodAthleteSettings);
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject fetch of 'dated athlete settings'", (done: Function) => {

			// Given
			const errorMessage = "Houston we have a problem";
			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.returnValue(Promise.reject(errorMessage));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {
				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, error => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(error).not.toBeNull();
				expect(error).toEqual(errorMessage);

				done();
			});

		});

	});

	describe("should add", () => {

		it("should add a dated athlete settings with already existing periods", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedPeriodAthleteSettings);

				done();

			}, error => {

				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should add a dated athlete settings with the single 'forever' existing period", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78))
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedPeriodAthleteSettings);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should add a dated athlete settings without existing periods", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const foreverDatedSettings = _.cloneDeep(athletePeriodSettingsToAdd); // Forever dated settings have until be created !
			foreverDatedSettings.since = null;
			expectedPeriodAthleteSettings.push(foreverDatedSettings);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedPeriodAthleteSettings);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject add of an existing dated athlete settings", (done: Function) => {

			// Given
			const addAtDate = "2018-04-15";
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel(addAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel(addAtDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_EXISTS);
				expect(error.message).toEqual("Dated athlete settings already exists. You should edit it instead.");

				done();
			});
		});

		it("should reject add of invalid dated athlete settings date", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const invalidDate = "2018-99-99";
			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel(invalidDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE);
				expect(error.message).toEqual("Dated athlete settings has invalid date.");

				done();
			});
		});

	});

	describe("should save", () => {

		it("should save several dated athlete settings", (done: Function) => {

			// Given
			const expectedPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const validateSpy = spyOn(service, "validate").and.returnValue(Promise.resolve());

			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.save(expectedPeriodAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedPeriodAthleteSettings);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {

				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

	});

	describe("should reset", () => {

		it("should reset dated athlete settings", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const addDaoSpy = spyOn(service, "add").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.reset();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(2);
				expect(_.first(result)).toEqual(DatedAthleteSettingsModel.DEFAULT_MODEL);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(addDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {

				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

	});

	describe("should edit", () => {

		it("should edit 'settings' a of dated athlete settings with already existing periods", (done: Function) => {

			// Given
			const editAtDate = "2018-04-15";
			const datedAthleteSettingsModel_01 = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const datedAthleteSettingsModel_02 = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const datedAthleteSettingsModel_03 = new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const datedAthleteSettingsModel_04 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));
			const expectedEditedPeriodAthleteSettings = [datedAthleteSettingsModel_01, expectedEditedDatedAthleteSettings,
				datedAthleteSettingsModel_03, datedAthleteSettingsModel_04];

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should edit 'since date & settings' of a dated athlete settings with already existing periods", (done: Function) => {

			// Given
			const editAtDate = "2018-04-15";
			const datedAthleteSettingsModel_01 = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const datedAthleteSettingsModel_02 = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const datedAthleteSettingsModel_03 = new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const datedAthleteSettingsModel_04 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedNewDate = "2018-03-01";
			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const expectedEditedPeriodAthleteSettings = [datedAthleteSettingsModel_01, expectedEditedDatedAthleteSettings,
				datedAthleteSettingsModel_03, datedAthleteSettingsModel_04];

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should edit the single 'forever' existing period", (done: Function) => {

			// Given
			const editAtDate = null;
			const foreverDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				foreverDatedAthleteSettingsModel
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));
			const expectedEditedPeriodAthleteSettings = [expectedEditedDatedAthleteSettings];

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject edit of an non-existing dated athlete settings", (done: Function) => {

			// Given
			const fakeEditAtDate = "2018-04-23";
			const datedAthleteSettingsModel_01 = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const datedAthleteSettingsModel_02 = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const datedAthleteSettingsModel_03 = new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const datedAthleteSettingsModel_04 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedNewDate = "2018-03-01";
			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(fakeEditAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS);
				expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
				done();
			});
		});

		it("should reject edit of an dated athlete settings that conflict with another existing one", (done: Function) => {

			// Given
			const editAtDate = "2018-05-10";
			const existingDatedSettingsDate = "2018-02-01";
			const datedAthleteSettingsModel_01 = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const datedAthleteSettingsModel_02 = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const datedAthleteSettingsModel_03 = new DatedAthleteSettingsModel(existingDatedSettingsDate, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const datedAthleteSettingsModel_04 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(existingDatedSettingsDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_EXISTS);
				expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
				done();
			});


		});

		it("should reject edit of invalid dated athlete settings date", (done: Function) => {

			// Given
			const invalidDate = "2018-99-99";
			const datedAthleteSettingsModel_01 = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const datedAthleteSettingsModel_02 = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const datedAthleteSettingsModel_03 = new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const datedAthleteSettingsModel_04 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(invalidDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.edit(invalidDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE);
				expect(error.message).toEqual("Dated athlete settings has invalid date.");
				done();
			});
		});

	});

	describe("should remove", () => {

		it("should remove a dated athlete settings with already existing periods", (done: Function) => {

			// Given
			const removeSinceIdentifier = "2018-04-15";
			const removeDatedAthleteSettingsIndex = 1;
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel(removeSinceIdentifier, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithVector(existingPeriodAthleteSettings);

			const expectedPeriodAthleteSettings = _.cloneDeep(existingPeriodAthleteSettings);
			expectedPeriodAthleteSettings.splice(removeDatedAthleteSettingsIndex, 1);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.remove(removeSinceIdentifier);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedPeriodAthleteSettings);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject deletion of the 'forever' existing period", (done: Function) => {

			// Given
			const removeSinceIdentifier = null;
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(removeSinceIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.remove(removeSinceIdentifier);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever dated athlete settings cannot be removed.");
				done();
			});

		});

		it("should reject deletion of the single 'forever' existing period", (done: Function) => {

			// Given
			const removeSinceIdentifier = null;
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel(removeSinceIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.remove(removeSinceIdentifier);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever dated athlete settings cannot be removed.");
				done();
			});

		});

		it("should reject deletion of a non-existing period", (done: Function) => {

			// Given
			const removeSinceIdentifier = "fake";
			const existingPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.datedAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.datedAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.remove(removeSinceIdentifier);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS);
				expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
				done();
			});

		});
	});

	describe("should validate", () => {

		it("should validate dated athlete settings consistency", (done: Function) => {

			// Given
			const periodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const spyResolve = spyOn(Promise, "resolve").and.callThrough();

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				expect(spyResolve).toHaveBeenCalled();
				done();
			}, (error: AppError) => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should not validate dated athlete settings consistency with duplicate identifier (1)", (done: Function) => {

			// Given
			const duplicateSinceIdentifier = "2018-05-10";
			const periodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel(duplicateSinceIdentifier, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel(duplicateSinceIdentifier, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES);
				expect(error.message).toEqual("Dated athlete settings have duplicates.");
				done();
			});
		});

		it("should not validate dated athlete settings consistency with duplicate identifier (2)", (done: Function) => {

			// Given
			const duplicateSinceIdentifier = null;
			const periodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel(duplicateSinceIdentifier, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel(duplicateSinceIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(duplicateSinceIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES);
				expect(error.message).toEqual("Dated athlete settings have duplicates.");
				done();
			});
		});

		it("should not validate dated athlete settings consistency with missing 'forever' dated settings", (done: Function) => {

			// Given
			const periodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever dated athlete settings must exists.");
				done();
			});
		});

	});
});
