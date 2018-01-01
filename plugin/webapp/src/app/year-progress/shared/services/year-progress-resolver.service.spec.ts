import { TestBed } from '@angular/core/testing';

import { YearProgressResolverService } from './year-progress-resolver.service';
import { ActivityDao } from "../../../shared/dao/activity/activity.dao";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { UserSettingsDao } from "../../../shared/dao/user-settings/user-settings.dao";
import { RequiredYearProgressDataModel } from "../models/required-year-progress-data.model";
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";

describe('YearProgressResolverService', () => {

	let userSettingsService: UserSettingsService;
	let yearProgressResolverService: YearProgressResolverService;
	let activityDao: ActivityDao;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				YearProgressResolverService,
				UserSettingsService,
				UserSettingsDao,
				ActivityDao
			]
		});

		yearProgressResolverService = TestBed.get(YearProgressResolverService);
		userSettingsService = TestBed.get(UserSettingsService);
		activityDao = TestBed.get(ActivityDao);


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
