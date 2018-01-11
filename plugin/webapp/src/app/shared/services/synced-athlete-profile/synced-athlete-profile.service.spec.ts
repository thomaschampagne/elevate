import { TestBed } from '@angular/core/testing';

import { SyncedAthleteProfileService } from './synced-athlete-profile.service';
import { SyncedAthleteProfileDao } from "../../dao/synced-athlete-profile/synced-athlete-profile.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";

describe('SyncedAthleteProfileService', () => {

	let syncedAthleteProfileService: SyncedAthleteProfileService = null;
	let syncedAthleteProfileDao: SyncedAthleteProfileDao = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SyncedAthleteProfileService, SyncedAthleteProfileDao]
		});
		// Retrieve injected syncedAthleteProfileService
		syncedAthleteProfileService = TestBed.get(SyncedAthleteProfileService);

		syncedAthleteProfileDao = TestBed.get(SyncedAthleteProfileDao);
	});

	it("should be created", (done: Function) => {
		expect(syncedAthleteProfileService).toBeTruthy();
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

		spyOn(syncedAthleteProfileDao, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));

		// When
		const promise: Promise<AthleteProfileModel> = syncedAthleteProfileService.getProfile();

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

	it("should get synced athlete profile", (done: Function) => {

		// Given
		const expectedLastSyncDateTime: number = 666;
		spyOn(syncedAthleteProfileDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = syncedAthleteProfileService.getLastSyncDateTime();

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
