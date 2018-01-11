import { TestBed } from '@angular/core/testing';

import { SyncedAthleteProfileDao } from './synced-athlete-profile.dao';
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";


describe('SyncedAthleteProfileDao', () => {

	let syncedAthleteProfileDao: SyncedAthleteProfileDao = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [SyncedAthleteProfileDao]
		});

		// Retrieve injected service
		syncedAthleteProfileDao = TestBed.get(SyncedAthleteProfileDao);
	});

	it("should be created", (done: Function) => {
		expect(syncedAthleteProfileDao).toBeTruthy();
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

		spyOn(syncedAthleteProfileDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(<{ syncWithAthleteProfile: AthleteProfileModel }> {syncWithAthleteProfile: expectedAthleteProfileModel});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = syncedAthleteProfileDao.getProfile();

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
		const expectedLastSyncDateTime: number = 9999;

		spyOn(syncedAthleteProfileDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(<{ lastSyncDateTime: number }> {lastSyncDateTime: expectedLastSyncDateTime});
			}
		});

		// When
		const promise: Promise<number> = syncedAthleteProfileDao.getLastSyncDateTime();

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
});
