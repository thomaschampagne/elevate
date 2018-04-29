import { TestBed } from "@angular/core/testing";

import { AthleteHistoryDao } from "./athlete-history.dao";


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

	it("should get last sync date of profile", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "browserStorageLocal").and.returnValue({
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

	it("should save last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "browserStorageLocal").and.returnValue({
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

	it("should remove last sync date time", (done: Function) => {

		// Given
		spyOn(athleteHistoryDao, "browserStorageLocal").and.returnValue({
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
			expect(athleteHistoryDao.browserStorageLocal).toHaveBeenCalled();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reject on remove last sync date time", (done: Function) => {

		const expectedLastSyncDateTime = 9999;

		spyOn(athleteHistoryDao, "browserStorageLocal").and.returnValue({
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
