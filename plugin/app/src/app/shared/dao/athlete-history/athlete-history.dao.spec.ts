import { TestBed } from "@angular/core/testing";

import { AthleteHistoryDao } from "./athlete-history.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";


describe("AthleteHistoryDao", () => {

	let athleteHistoryDao: AthleteHistoryDao = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [AthleteHistoryDao]
		});

		// Retrieve injected service
		athleteHistoryDao = TestBed.get(AthleteHistoryDao);
	});

	it("should be created", (done: Function) => {
		expect(athleteHistoryDao).toBeTruthy();
		done();
	});

	it("should get synced athlete profile", (done: Function) => {

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

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncWithAthleteProfile: expectedAthleteProfileModel});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryDao.getProfile();

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

	it("should get last sync date of profile", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({lastSyncDateTime: expectedLastSyncDateTime});
			}
		});

		// When
		const promise: Promise<number> = athleteHistoryDao.getLastSyncDateTime();

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

	it("should save athlete profile", (done: Function) => {

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

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncWithAthleteProfile: athleteProfileModelToSave});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryDao.saveProfile(athleteProfileModelToSave);

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

	it("should save last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({lastSyncDateTime: expectedLastSyncDateTime});
			}
		});

		// When
		const promise: Promise<number> = athleteHistoryDao.saveLastSyncDateTime(expectedLastSyncDateTime);

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

	it("should remove athlete profile", (done: Function) => {

		// Given
		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			remove: (key: string, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncWithAthleteProfile: null});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryDao.removeProfile();

		// Then
		promise.then((result: AthleteProfileModel) => {

			expect(result).toBeNull();
			expect(athleteHistoryDao.chromeStorageLocal).toHaveBeenCalled();
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should reject on remove athlete profile", (done: Function) => {

		// Given
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const athleteProfileModelToRemove: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			remove: (key: string, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncWithAthleteProfile: athleteProfileModelToRemove});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = athleteHistoryDao.removeProfile();

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Profile has not been deleted");
			done();
		});

	});

	it("should remove last sync date time", (done: Function) => {

		// Given
		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			remove: (key: string, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({lastSyncDateTime: null});
			}
		});

		// When
		const promise: Promise<number> = athleteHistoryDao.removeLastSyncDateTime();

		// Then
		promise.then((lastSyncDateTime: number) => {

			expect(lastSyncDateTime).toBeNull();
			expect(athleteHistoryDao.chromeStorageLocal).toHaveBeenCalled();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reject on remove last sync date time", (done: Function) => {

		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "chromeStorageLocal").and.returnValue({
			remove: (key: string, callback: () => {}) => {
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({lastSyncDateTime: expectedLastSyncDateTime});
			}
		});

		// When
		const promise: Promise<number> = athleteHistoryDao.removeLastSyncDateTime();

		// Then
		promise.then((lastSyncDateTime: number) => {
			expect(lastSyncDateTime).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("LastSyncDateTime has not been deleted");
			done();
		});

	});

});
