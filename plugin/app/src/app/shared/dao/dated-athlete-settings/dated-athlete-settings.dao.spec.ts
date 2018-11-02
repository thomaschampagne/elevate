import { TestBed } from "@angular/core/testing";
import { DatedAthleteSettingsDao } from "./dated-athlete-settings.dao";
import { AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";

describe("DatedAthleteSettingsDao", () => {

	let datedAthleteSettingsDao: DatedAthleteSettingsDao;

	let _TEST_DATED_ATHLETE_SETTINGS_: DatedAthleteSettingsModel[] = null;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			providers: [DatedAthleteSettingsDao]
		});

		const restHr = 50;
		const lthr = {
			default: 185,
			cycling: null,
			running: null
		};
		const runningFTP = 350;
		const swimFTP = 31;

		_TEST_DATED_ATHLETE_SETTINGS_ = [
			new DatedAthleteSettingsModel("2018-06-02", new AthleteSettingsModel(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
			new DatedAthleteSettingsModel("2018-02-15", new AthleteSettingsModel(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
		];

		// Retrieve injected service
		datedAthleteSettingsDao = TestBed.get(DatedAthleteSettingsDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(datedAthleteSettingsDao).toBeTruthy();
		done();
	});

	describe("fetch", () => {

		it("should fetch DatedAthleteSettingsModels", (done: Function) => {

			// Given
			const browserStorageLocalSpy = spyOn(datedAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({datedAthleteSettings: _TEST_DATED_ATHLETE_SETTINGS_});
				}
			});

			spyOn(datedAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = datedAthleteSettingsDao.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(_TEST_DATED_ATHLETE_SETTINGS_);
				expect(result.length).toEqual(_TEST_DATED_ATHLETE_SETTINGS_.length);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should fetch empty DatedAthleteSettingsModels", (done: Function) => {

			// Given
			const athleteDatedSettingsEmpty = [];
			const expectedLength = 0;
			const browserStorageLocalSpy = spyOn(datedAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({datedAthleteSettings: athleteDatedSettingsEmpty});
				}
			});

			spyOn(datedAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = datedAthleteSettingsDao.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(athleteDatedSettingsEmpty);
				expect(result.length).toEqual(expectedLength);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject fetch DatedAthleteSettingsModels", (done: Function) => {

			// Given
			const browserStorageLocalSpy = spyOn(datedAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({datedAthleteSettings: _TEST_DATED_ATHLETE_SETTINGS_});
				}
			});
			const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";

			const chromeError: chrome.runtime.LastError = {
				message: expectedErrorMessage
			};
			const getChromeErrorSpy = spyOn(datedAthleteSettingsDao, "getChromeError").and.returnValue(chromeError);

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = datedAthleteSettingsDao.fetch();

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

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

		it("should save DatedAthleteSettingsModels", (done: Function) => {

			// Given
			const athletePeriodSettingsToSave = _TEST_DATED_ATHLETE_SETTINGS_;
			const browserStorageLocalSpy = spyOn(datedAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				set: (object: Object, callback: () => {}) => {
					callback();
				},
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({datedAthleteSettings: _TEST_DATED_ATHLETE_SETTINGS_});
				}
			});

			spyOn(datedAthleteSettingsDao, "getChromeError").and.returnValue(undefined);

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = datedAthleteSettingsDao.save(athletePeriodSettingsToSave);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

				expect(result).not.toBeNull();
				expect(result).toEqual(athletePeriodSettingsToSave);
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject save DatedAthleteSettingsModels", (done: Function) => {

			// Given
			const athletePeriodSettingsToSave = _TEST_DATED_ATHLETE_SETTINGS_;
			const browserStorageLocalSpy = spyOn(datedAthleteSettingsDao, "browserStorageLocal").and.returnValue({
				set: (object: Object, callback: () => {}) => {
					callback();
				},
				get: (keys: any, callback: (item: Object) => {}) => {
					callback({datedAthleteSettings: _TEST_DATED_ATHLETE_SETTINGS_});
				}
			});
			const expectedErrorMessage = "Whoops! A chrome runtime error has been raised!";

			const chromeError: chrome.runtime.LastError = {
				message: expectedErrorMessage
			};
			const getChromeErrorSpy = spyOn(datedAthleteSettingsDao, "getChromeError").and.returnValue(chromeError);

			// When
			const promise: Promise<DatedAthleteSettingsModel[]> = datedAthleteSettingsDao.save(athletePeriodSettingsToSave);

			// Then
			promise.then((result: DatedAthleteSettingsModel[]) => {

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
