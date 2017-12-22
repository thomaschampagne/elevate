import { TestBed } from '@angular/core/testing';

import { AthleteProfileDao } from './athlete-profile.dao';
import { AthleteProfileModel } from "../../../../../../common/scripts/interfaces/IAthleteProfile";

describe('AthleteProfileDao', () => {

	let athleteProfileDao: AthleteProfileDao = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [AthleteProfileDao]
		});

		// Retrieve injected service
		athleteProfileDao = TestBed.get(AthleteProfileDao);
	});

	it("should be created", (done: Function) => {
		expect(athleteProfileDao).toBeTruthy();
		done();
	});

	it("should get athlete profile", (done: Function) => {

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

		spyOn(athleteProfileDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(<{ syncWithAthleteProfile: AthleteProfileModel }> {syncWithAthleteProfile: expectedAthleteProfileModel});
			}
		});

		// When
		const promise: Promise<AthleteProfileModel> = athleteProfileDao.get();

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
});
