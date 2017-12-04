import { TestBed } from '@angular/core/testing';

import { ActivityDao } from './activity.dao';

import * as _ from "lodash";
import { ISyncActivityComputed } from "../../../../../../common/scripts/interfaces/ISync";
import { TEST_SYNCED_ACTIVITIES } from "../../../../fixtures/activities";

describe('ActivityDao', () => {

	let activityDao: ActivityDao;

	let testActivities: ISyncActivityComputed[] = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ActivityDao]
		});

		testActivities = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
	});

	it('should be created', (done: Function) => {
		expect(activityDao).toBeTruthy();
		done();
	});


	it('should fetch user settings', (done: Function) => {

		// Given
		const chromeStorageSyncLocalSpy = spyOn(activityDao, 'chromeStorageLocal').and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		// When
		const promise: Promise<ISyncActivityComputed[]> = activityDao.fetch();

		// Then
		promise.then((result: ISyncActivityComputed[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(TEST_SYNCED_ACTIVITIES);
			expect(result.length).toEqual(TEST_SYNCED_ACTIVITIES.length);
			expect(chromeStorageSyncLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
