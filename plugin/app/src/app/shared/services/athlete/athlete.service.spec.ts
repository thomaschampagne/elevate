import { TestBed } from "@angular/core/testing";
import { AthleteService } from "./athlete.service";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel, Gender } from "@elevate/shared/models";
import * as _ from "lodash";
import { AthleteDao } from "../../dao/athlete/athlete-dao.service";
import { AppError } from "../../models/app-error.model";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";

describe("AthleteService", () => {

	let service: AthleteService = null;
	let defaultAthleteModel: AthleteModel = null;

	let since;
	let until;
	let maxHr;
	let restHr;
	let lthr;
	let cyclingFTP;
	let runningFTP;
	let swimFTP;
	let weight;
	let mockedDataStore: MockedDataStore<AthleteModel>;

	beforeEach((done: Function) => {

		mockedDataStore = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				AthleteService,
				AthleteDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		service = TestBed.get(AthleteService);

		defaultAthleteModel = new AthleteModel(Gender.MEN, null);

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

		it("should fetch and sort descending existing 'dated athlete settings' from athlete model", (done: Function) => {

			// Given
			const expectedApsModel_03 = new DatedAthleteSettingsModel("2018-06-01", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const expectedApsModel_02 = new DatedAthleteSettingsModel("2018-02-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const expectedApsModel_01 = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			defaultAthleteModel.datedAthleteSettings = [
				expectedApsModel_03,
				expectedApsModel_01, // Introduce not sorted period between 01/02
				expectedApsModel_02, // Introduce not sorted period between 01/02
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();

			// When
			const promise: Promise<AthleteModel> = service.fetch();

			// Then
			promise.then((athleteModel: AthleteModel) => {

				expect(athleteModel).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				expect(athleteModel.datedAthleteSettings[0]).toEqual(expectedApsModel_03);
				expect(athleteModel.datedAthleteSettings[1]).toEqual(expectedApsModel_02);
				expect(athleteModel.datedAthleteSettings[2]).toEqual(expectedApsModel_01);

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

			defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;
			mockedDataStore.initWithObject(defaultAthleteModel);

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();

			// When
			const promise: Promise<AthleteModel> = service.fetch();

			// Then
			promise.then((athleteModel: AthleteModel) => {

				expect(athleteModel).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(athleteModel.datedAthleteSettings).toEqual(existingPeriodAthleteSettings);
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
			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.returnValue(Promise.reject(errorMessage));

			// When
			const promise: Promise<AthleteModel> = service.fetch();

			// Then
			promise.then((athleteModel: AthleteModel) => {
				expect(athleteModel).toBeNull();
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

			defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;
			mockedDataStore.initWithObject(defaultAthleteModel);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.addSettings(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedAthleteModel.datedAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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

			defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;
			mockedDataStore.initWithObject(defaultAthleteModel);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.addSettings(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedAthleteModel.datedAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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

			defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;
			mockedDataStore.initWithObject(defaultAthleteModel);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const foreverDatedSettings = _.cloneDeep(athletePeriodSettingsToAdd); // Forever dated settings have until be created !
			foreverDatedSettings.since = null;
			expectedPeriodAthleteSettings.push(foreverDatedSettings);

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.addSettings(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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
			defaultAthleteModel.datedAthleteSettings = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel(addAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			mockedDataStore.initWithObject(defaultAthleteModel);

			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel(addAtDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.addSettings(athletePeriodSettingsToAdd);

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
			defaultAthleteModel.datedAthleteSettings = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const invalidDate = "2018-99-99";
			const athletePeriodSettingsToAdd = new DatedAthleteSettingsModel(invalidDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.addSettings(athletePeriodSettingsToAdd);

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

		it("should save several dated athlete settings of AthleteModel", (done: Function) => {

			// Given
			const expectedPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const validateSpy = spyOn(service, "validate").and.returnValue(Promise.resolve());

			const athleteModelToSave = _.cloneDeep(defaultAthleteModel);
			athleteModelToSave.datedAthleteSettings = expectedPeriodAthleteSettings;

			const expectedAthleteModel = _.cloneDeep(athleteModelToSave);

			const saveDaoSpy = spyOn(service.athleteModelDao, "save")
				.and.returnValue(Promise.resolve(athleteModelToSave));

			// When
			const promise: Promise<AthleteModel> = service.save(athleteModelToSave);

			// Then
			promise.then((athleteModel: AthleteModel) => {

				expect(athleteModel).not.toBeNull();
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);
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

		it("should reset dated athlete settings of AthleteModel", (done: Function) => {

			// Given
			defaultAthleteModel.datedAthleteSettings = [
				new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const addDaoSpy = spyOn(service, "addSettings").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.resetSettings();

			// Then
			promise.then((datedAthleteSettings: DatedAthleteSettingsModel[]) => {

				expect(datedAthleteSettings).not.toBeNull();
				expect(datedAthleteSettings.length).toEqual(2);
				expect(_.first(datedAthleteSettings)).toEqual(DatedAthleteSettingsModel.DEFAULT_MODEL);
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

			defaultAthleteModel.datedAthleteSettings = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));
			const expectedEditedPeriodAthleteSettings = [datedAthleteSettingsModel_01, expectedEditedDatedAthleteSettings,
				datedAthleteSettingsModel_03, datedAthleteSettingsModel_04];

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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

			defaultAthleteModel.datedAthleteSettings = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedNewDate = "2018-03-01";
			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const expectedEditedPeriodAthleteSettings = [datedAthleteSettingsModel_01, expectedEditedDatedAthleteSettings,
				datedAthleteSettingsModel_03, datedAthleteSettingsModel_04];

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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

			defaultAthleteModel.datedAthleteSettings = [
				foreverDatedAthleteSettingsModel
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));
			const expectedEditedPeriodAthleteSettings = [expectedEditedDatedAthleteSettings];

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(editAtDate, expectedEditedDatedAthleteSettings);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedEditedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

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

			defaultAthleteModel.datedAthleteSettings = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedNewDate = "2018-03-01";
			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(fakeEditAtDate, expectedEditedDatedAthleteSettings);

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

			defaultAthleteModel.datedAthleteSettings = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(existingDatedSettingsDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(editAtDate, expectedEditedDatedAthleteSettings);

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

			defaultAthleteModel.datedAthleteSettings = [
				datedAthleteSettingsModel_01,
				datedAthleteSettingsModel_02,
				datedAthleteSettingsModel_03,
				datedAthleteSettingsModel_04
			];
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedEditedDatedAthleteSettings = new DatedAthleteSettingsModel(invalidDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.editSettings(invalidDate, expectedEditedDatedAthleteSettings);

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

			defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;
			mockedDataStore.initWithObject(defaultAthleteModel);

			const expectedPeriodAthleteSettings = _.cloneDeep(existingPeriodAthleteSettings);
			expectedPeriodAthleteSettings.splice(removeDatedAthleteSettingsIndex, 1);

			const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
			expectedAthleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch").and.callThrough();
			const validateSpy = spyOn(service, "validate").and.callThrough();
			const saveDaoSpy = spyOn(service.athleteModelDao, "save").and.callThrough();

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.removeSettings(removeSinceIdentifier);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(expectedPeriodAthleteSettings);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);
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

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.athleteModelDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.removeSettings(removeSinceIdentifier);

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

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.athleteModelDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.removeSettings(removeSinceIdentifier);

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

			const fetchDaoSpy = spyOn(service.athleteModelDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const saveDaoSpy = spyOn(service.athleteModelDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = service.removeSettings(removeSinceIdentifier);

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
