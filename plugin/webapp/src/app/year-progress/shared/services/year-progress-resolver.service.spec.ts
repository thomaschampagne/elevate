import { TestBed } from '@angular/core/testing';

import { YearProgressResolverService } from './year-progress-resolver.service';
import { ActivityDao } from "../../../shared/dao/activity/activity.dao";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { UserSettingsDao } from "../../../shared/dao/user-settings/user-settings.dao";
import { RequiredYearProgressDataModel } from "../models/required-year-progress-data.model";
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";
import { AthleteHistoryService } from "../../../shared/services/athlete-history/athlete-history.service";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { AthleteHistoryState } from "../../../shared/services/athlete-history/athlete-history-state.enum";
import { AthleteHistoryDao } from "../../../shared/dao/athlete-history/athlete-history.dao";

describe('YearProgressResolverService', () => {

	let yearProgressResolverService: YearProgressResolverService;
	let athleteHistoryService: AthleteHistoryService;
	let userSettingsService: UserSettingsService;
	let activityDao: ActivityDao;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				YearProgressResolverService,
				AthleteHistoryService,
				AthleteHistoryDao,
				UserSettingsService,
				UserSettingsDao,
				ActivityDao
			]
		});

		yearProgressResolverService = TestBed.get(YearProgressResolverService);
		athleteHistoryService = TestBed.get(AthleteHistoryService);
		userSettingsService = TestBed.get(UserSettingsService);
		activityDao = TestBed.get(ActivityDao);

		// Mocking athlete history
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

		spyOn(athleteHistoryService, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));
		spyOn(athleteHistoryService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(athleteHistoryService, "getSyncState").and.returnValue(Promise.resolve(AthleteHistoryState.SYNCED));
	});

	it("should be created", (done: Function) => {
		expect(yearProgressResolverService).toBeTruthy();
		done();
	});

	it("should resolve required year progress data", (done: Function) => {

		// Given
		const route = null;
		const state = null;
		const expectedIsMetric = (userSettings.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);
		const syncedActivityModels = YearProgressActivitiesFixture.provide();
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettings));
		spyOn(activityDao, "fetch").and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise = yearProgressResolverService.resolve(route, state);

		// Then
		promise.then((result: RequiredYearProgressDataModel) => {

			expect(result).not.toBeNull();
			expect(result.isMetric).toEqual(expectedIsMetric);
			expect(result.syncedActivityModels).toEqual(syncedActivityModels);
			done();

		}, error => {

			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		});

	});

});
