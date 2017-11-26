import { TestBed } from '@angular/core/testing';
import { ActivityService } from './activity.service';
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";
import { UNIT_TEST_ACTIVITIES } from "../../../fixtures/activities";
import { ActivityDao } from "../../dao/activity/activity.dao";
import * as _ from "lodash";

describe('ActivityService', () => {

	let activityService: ActivityService = null;

	let testActivities: ISyncActivityComputed[] = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ActivityService, ActivityDao]
		});

		testActivities = _.cloneDeep(UNIT_TEST_ACTIVITIES);

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);
	});

	it('should be created', (done: Function) => {
		expect(activityService).toBeTruthy();
		done();
	});

	it('should fetch activities', (done: Function) => {

		// Given
		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(testActivities));

		// When
		const promise: Promise<ISyncActivityComputed[]> = activityService.fetch();

		// Then
		promise.then((result: ISyncActivityComputed[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(testActivities.length);
			expect(result).toEqual(testActivities);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});
});
