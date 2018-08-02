import { TestBed } from "@angular/core/testing";
import { PeriodicAthleteSettingsService } from "./periodic-athlete-settings.service";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as _ from "lodash";
import { PeriodicAthleteSettingsDao } from "../../dao/periodic-athlete-settings/periodic-athlete-settings.dao";
import { AppError } from "../../models/app-error.model";
import { AthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/athlete-settings.model";

describe("PeriodicAthleteSettingsService", () => {

	let service: PeriodicAthleteSettingsService = null;

	let from;
	let to;
	let maxHr;
	let restHr;
	let lthr;
	let cyclingFTP;
	let runningFTP;
	let swimFTP;
	let weight;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				PeriodicAthleteSettingsService,
				PeriodicAthleteSettingsDao
			]
		});

		// Retrieve injected service
		service = TestBed.get(PeriodicAthleteSettingsService);

		from = new Date();
		to = new Date();
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
	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});

	describe("should fetch", () => {

		it("should fetch and sort descending existing 'periodic athlete settings'", (done: Function) => {

			// Given
			const expectedApsModel_03 = new PeriodicAthleteSettingsModel("2018-06-01", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const expectedApsModel_02 = new PeriodicAthleteSettingsModel("2018-02-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const expectedApsModel_01 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				expectedApsModel_03,
				expectedApsModel_01, // Introduce not sorted period between 01/02
				expectedApsModel_02, // Introduce not sorted period between 01/02
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch").and.returnValue(Promise.resolve(existingPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

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

		it("should fetch empty 'periodic athlete settings'", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch").and.returnValue(Promise.resolve(existingPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

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

		it("should reject fetch of 'periodic athlete settings'", (done: Function) => {

			// Given
			const errorMessage = "We got a browser error!";
			const error: chrome.runtime.LastError = {message: errorMessage};
			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch").and.returnValue(Promise.reject(error));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {
				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: chrome.runtime.LastError) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(error).not.toBeNull();
				expect(error.message).toEqual(errorMessage);

				done();
			});

		});

	});

	describe("should add", () => {

		it("should add a periodic athlete settings with already existing periods", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const athletePeriodSettingsToAdd = new PeriodicAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
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

		it("should add a periodic athlete settings with the single 'forever' existing period", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78))
			];

			const athletePeriodSettingsToAdd = new PeriodicAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
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

		it("should add a periodic athlete settings without existing periods", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [];

			const athletePeriodSettingsToAdd = new PeriodicAthleteSettingsModel("2018-06-03", new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const foreverPeriodicSettings = _.cloneDeep(athletePeriodSettingsToAdd); // Forever periodic settings have to be created !
			foreverPeriodicSettings.from = null;
			expectedPeriodAthleteSettings.push(foreverPeriodicSettings);

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
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

		it("should reject add of an existing periodic athlete settings", (done: Function) => {

			// Given
			const addAtDate = "2018-04-15";
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel(addAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const athletePeriodSettingsToAdd = new PeriodicAthleteSettingsModel(addAtDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save");

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_EXISTS);
				expect(error.message).toEqual("Periodic athlete settings already exists. You should edit it instead.");

				done();
			});
		});

		it("should reject add of invalid periodic athlete settings date", (done: Function) => {

			// Given
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const invalidDate = "2018-99-99";
			const athletePeriodSettingsToAdd = new PeriodicAthleteSettingsModel(invalidDate, new AthleteSettingsModel(maxHr,
				restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight));

			const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.add(athletePeriodSettingsToAdd);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_INVALID_DATE);
				expect(error.message).toEqual("Periodic athlete settings has invalid date.");

				done();
			});
		});

	});

	describe("should edit", () => {

		it("should edit 'settings' a of periodic athlete settings with already existing periods", (done: Function) => {

			// Given
			const editAtDate = "2018-04-15";
			const periodicAthleteSettingsModel_01 = new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const periodicAthleteSettingsModel_02 = new PeriodicAthleteSettingsModel(editAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const periodicAthleteSettingsModel_03 = new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const periodicAthleteSettingsModel_04 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				periodicAthleteSettingsModel_01,
				periodicAthleteSettingsModel_02,
				periodicAthleteSettingsModel_03,
				periodicAthleteSettingsModel_04
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const expectedEditedPeriodAthleteSettings = [periodicAthleteSettingsModel_01, expectedEditedPeriodicAthleteSettings,
				periodicAthleteSettingsModel_03, periodicAthleteSettingsModel_04];

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedEditedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should edit 'from date & settings' of a periodic athlete settings with already existing periods", (done: Function) => {

			// Given
			const editAtDate = "2018-04-15";
			const periodicAthleteSettingsModel_01 = new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const periodicAthleteSettingsModel_02 = new PeriodicAthleteSettingsModel(editAtDate, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const periodicAthleteSettingsModel_03 = new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const periodicAthleteSettingsModel_04 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				periodicAthleteSettingsModel_01,
				periodicAthleteSettingsModel_02,
				periodicAthleteSettingsModel_03,
				periodicAthleteSettingsModel_04
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedNewDate = "2018-03-01";
			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const expectedEditedPeriodAthleteSettings = [periodicAthleteSettingsModel_01, expectedEditedPeriodicAthleteSettings,
				periodicAthleteSettingsModel_03, periodicAthleteSettingsModel_04];

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedEditedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

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
			const foreverPeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				foreverPeriodicAthleteSettingsModel
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(editAtDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const expectedEditedPeriodAthleteSettings = [expectedEditedPeriodicAthleteSettings];

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedEditedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith(expectedEditedPeriodAthleteSettings);
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject edit of an non-existing periodic athlete settings", (done: Function) => {

			// Given
			const fakeEditAtDate = "2018-04-23";
			const periodicAthleteSettingsModel_01 = new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const periodicAthleteSettingsModel_02 = new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const periodicAthleteSettingsModel_03 = new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const periodicAthleteSettingsModel_04 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				periodicAthleteSettingsModel_01,
				periodicAthleteSettingsModel_02,
				periodicAthleteSettingsModel_03,
				periodicAthleteSettingsModel_04
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedNewDate = "2018-03-01";
			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(expectedNewDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save");

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(fakeEditAtDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_DO_NOT_EXISTS);
				expect(error.message).toEqual("Periodic athlete settings do not exists. You should add it instead.");
				done();
			});
		});

		it("should reject edit of an periodic athlete settings that conflict with another existing one", (done: Function) => {

			// Given
			const editAtDate = "2018-05-10";
			const existingPeriodicSettingsDate = "2018-02-01";
			const periodicAthleteSettingsModel_01 = new PeriodicAthleteSettingsModel(editAtDate, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const periodicAthleteSettingsModel_02 = new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const periodicAthleteSettingsModel_03 = new PeriodicAthleteSettingsModel(existingPeriodicSettingsDate, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const periodicAthleteSettingsModel_04 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				periodicAthleteSettingsModel_01,
				periodicAthleteSettingsModel_02,
				periodicAthleteSettingsModel_03,
				periodicAthleteSettingsModel_04
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(existingPeriodicSettingsDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save");

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(editAtDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_EXISTS);
				expect(error.message).toEqual("Periodic athlete settings do not exists. You should add it instead.");
				done();
			});


		});

		it("should reject edit of invalid periodic athlete settings date", (done: Function) => {

			// Given
			const invalidDate = "2018-99-99";
			const periodicAthleteSettingsModel_01 = new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75));
			const periodicAthleteSettingsModel_02 = new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76));
			const periodicAthleteSettingsModel_03 = new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));
			const periodicAthleteSettingsModel_04 = new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78));

			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				periodicAthleteSettingsModel_01,
				periodicAthleteSettingsModel_02,
				periodicAthleteSettingsModel_03,
				periodicAthleteSettingsModel_04
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedEditedPeriodicAthleteSettings = new PeriodicAthleteSettingsModel(invalidDate, new AthleteSettingsModel(99, 99, lthr, 99, 99, 99, 99));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save");

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.edit(invalidDate, expectedEditedPeriodicAthleteSettings);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");

				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_INVALID_DATE);
				expect(error.message).toEqual("Periodic athlete settings has invalid date.");
				done();
			});
		});

	});

	describe("should remove", () => {

		it("should remove a periodic athlete settings with already existing periods", (done: Function) => {

			// Given
			const removeFromIdentifier = "2018-04-15";
			const removePeriodicAthleteSettingsIndex = 1;
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel(removeFromIdentifier, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const expectedPeriodAthleteSettings = _.cloneDeep(existingPeriodAthleteSettings);
			expectedPeriodAthleteSettings.splice(removePeriodicAthleteSettingsIndex, 1);

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.remove(removeFromIdentifier);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
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
			const removeFromIdentifier = null;
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(removeFromIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.remove(removeFromIdentifier);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever periodic athlete settings cannot be removed.");
				done();
			});

		});

		it("should reject deletion of the single 'forever' existing period", (done: Function) => {

			// Given
			const removeFromIdentifier = null;
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel(removeFromIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.remove(removeFromIdentifier);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(validateSpy).toHaveBeenCalledTimes(0);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever periodic athlete settings cannot be removed.");
				done();
			});

		});

		it("should reject deletion of a non-existing period", (done: Function) => {

			// Given
			const removeFromIdentifier = "fake";
			const existingPeriodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

			const fetchDaoSpy = spyOn(service.periodicAthleteSettingsDao, "fetch")
				.and.returnValue(Promise.resolve(_.cloneDeep(existingPeriodAthleteSettings)));

			const validateSpy = spyOn(service, "validate").and.callThrough();

			const saveDaoSpy = spyOn(service.periodicAthleteSettingsDao, "save")
				.and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = service.remove(removeFromIdentifier);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_DO_NOT_EXISTS);
				expect(error.message).toEqual("Periodic athlete settings do not exists. You should add it instead.");
				done();
			});

		});
	});

	describe("should verify", () => {

		it("should validate periodic athlete settings consistency", (done: Function) => {

			// Given
			const periodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				done();
			}, (error: AppError) => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should not validate periodic athlete settings consistency with duplicate identifier (1)", (done: Function) => {

			// Given
			const duplicateFromIdentifier = "2018-05-10";
			const periodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel(duplicateFromIdentifier, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel(duplicateFromIdentifier, new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_DUPLICATES);
				expect(error.message).toEqual("Periodic athlete settings have duplicates.");
				done();
			});
		});

		it("should not validate periodic athlete settings consistency with duplicate identifier (2)", (done: Function) => {

			// Given
			const duplicateFromIdentifier = null;
			const periodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel(duplicateFromIdentifier, new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel(duplicateFromIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
				new PeriodicAthleteSettingsModel(duplicateFromIdentifier, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_DUPLICATES);
				expect(error.message).toEqual("Periodic athlete settings have duplicates.");
				done();
			});
		});

		it("should not validate periodic athlete settings consistency with missing 'forever' periodic settings", (done: Function) => {

			// Given
			const periodAthleteSettings: PeriodicAthleteSettingsModel[] = [
				new PeriodicAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
				new PeriodicAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
				new PeriodicAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
			];

			// When
			const promise: Promise<void> = service.validate(periodAthleteSettings);

			// Then
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, (error: AppError) => {
				expect(error).not.toBeNull();
				expect(error.code).toEqual(AppError.PERIODIC_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
				expect(error.message).toEqual("Default forever periodic athlete settings must exists.");
				done();
			});
		});

	});
});
