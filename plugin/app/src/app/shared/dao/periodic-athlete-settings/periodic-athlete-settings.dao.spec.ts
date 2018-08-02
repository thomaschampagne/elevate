import { TestBed } from "@angular/core/testing";
import { PeriodicAthleteSettingsDao } from "./periodic-athlete-settings.dao";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { AthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/athlete-settings.model";

describe("PeriodicAthleteSettingsDao", () => {

	let periodicAthleteSettingsDao: PeriodicAthleteSettingsDao;

	let _TEST_PERIODIC_ATHLETE_SETTINGS_: PeriodicAthleteSettingsModel[] = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [PeriodicAthleteSettingsDao]
		});

		const restHr = 50;
		const lthr = {
			default: 185,
			cycling: null,
			running: null
		};
		const runningFTP = 350;
		const swimFTP = 31;

		_TEST_PERIODIC_ATHLETE_SETTINGS_ = [
			new PeriodicAthleteSettingsModel("2018-06-02", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
			new PeriodicAthleteSettingsModel("2018-02-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
			new PeriodicAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
		];

		// Retrieve injected service
		periodicAthleteSettingsDao = TestBed.get(PeriodicAthleteSettingsDao);
	});

	it("should be created", (done: Function) => {
		expect(periodicAthleteSettingsDao).toBeTruthy();
		done();
	});

	describe("fetch", () => {

		it("should fetch PeriodicAthleteSettingsModels", (done: Function) => {

			// Given
			const browserStorageLocalSpy = spyOn(periodicAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({periodicAthleteSettings: _TEST_PERIODIC_ATHLETE_SETTINGS_});
				}
			});

			spyOn(periodicAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = periodicAthleteSettingsDao.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(_TEST_PERIODIC_ATHLETE_SETTINGS_);
				expect(result.length).toEqual(_TEST_PERIODIC_ATHLETE_SETTINGS_.length);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should fetch empty PeriodicAthleteSettingsModels", (done: Function) => {

			// Given
			const athletePeriodicSettingsEmpty = [];
			const expectedLength = 0;
			const browserStorageLocalSpy = spyOn(periodicAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({periodicAthleteSettings: athletePeriodicSettingsEmpty});
				}
			});

			spyOn(periodicAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = periodicAthleteSettingsDao.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(athletePeriodicSettingsEmpty);
				expect(result.length).toEqual(expectedLength);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject fetch PeriodicAthleteSettingsModels", (done: Function) => {

			// Given
			const browserStorageLocalSpy = spyOn(periodicAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({periodicAthleteSettings: _TEST_PERIODIC_ATHLETE_SETTINGS_});
				}
			});
			const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";

			const chromeError: chrome.runtime.LastError = {
				message: expectedErrorMessage
			};
			const getChromeErrorSpy = spyOn(periodicAthleteSettingsDao, "getChromeError").and.returnValue(chromeError);

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = periodicAthleteSettingsDao.fetch();

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				done();

			}, error => {
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);
				expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
				expect(error).not.toBeNull();
				expect(error).toEqual(expectedErrorMessage);
				done();
			});
		});

	});

	describe("save", () => {

		it("should save PeriodicAthleteSettingsModels", (done: Function) => {

			// Given
			const athletePeriodSettingsToSave = _TEST_PERIODIC_ATHLETE_SETTINGS_;
			const browserStorageLocalSpy = spyOn(periodicAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				set: (object: Object, callback: () => {}) => {
					callback();
				},
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({periodicAthleteSettings: _TEST_PERIODIC_ATHLETE_SETTINGS_});
				}
			});

			spyOn(periodicAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = periodicAthleteSettingsDao.save(athletePeriodSettingsToSave);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(athletePeriodSettingsToSave);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject save PeriodicAthleteSettingsModels", (done: Function) => {

			// Given
			const athletePeriodSettingsToSave = _TEST_PERIODIC_ATHLETE_SETTINGS_;
			const browserStorageLocalSpy = spyOn(periodicAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				set: (object: Object, callback: () => {}) => {
					callback();
				},
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({periodicAthleteSettings: _TEST_PERIODIC_ATHLETE_SETTINGS_});
				}
			});
			const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";

			const chromeError: chrome.runtime.LastError = {
				message: expectedErrorMessage
			};
			const getChromeErrorSpy = spyOn(periodicAthleteSettingsDao, "getChromeError").and.returnValue(chromeError);

			// When
			const promise: Promise<PeriodicAthleteSettingsModel[]> = periodicAthleteSettingsDao.save(athletePeriodSettingsToSave);

			// Then
			promise.then((result: PeriodicAthleteSettingsModel[]) => {

				expect(result).toBeNull();
				done();

			}, error => {
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);
				expect(getChromeErrorSpy).toHaveBeenCalledTimes(1);
				expect(error).not.toBeNull();
				expect(error).toEqual(expectedErrorMessage);
				done();
			});
		});
	});
});
