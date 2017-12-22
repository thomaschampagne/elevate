import { TestBed } from '@angular/core/testing';

import { AthleteProfileService } from './athlete-profile.service';
import { AthleteProfileDao } from "../../dao/athlete-profile/athlete-profile.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/interfaces/IAthleteProfile";

describe('AthleteProfileService', () => {

	let athleteProfileService: AthleteProfileService = null;
	let athleteProfileDao: AthleteProfileDao = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AthleteProfileService, AthleteProfileDao]
		});
		// Retrieve injected athleteProfileService
		athleteProfileService = TestBed.get(AthleteProfileService);

		athleteProfileDao = TestBed.get(AthleteProfileDao);
	});

	it("should be created", (done: Function) => {
		expect(athleteProfileService).toBeTruthy();
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

		spyOn(athleteProfileDao, "get").and.returnValue(Promise.resolve(expectedAthleteProfileModel));

		// When
		const promise: Promise<AthleteProfileModel> = athleteProfileService.get();

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
