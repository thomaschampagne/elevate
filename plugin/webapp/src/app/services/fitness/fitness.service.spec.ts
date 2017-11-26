import { TestBed } from '@angular/core/testing';

import { FitnessService } from './fitness.service';
import { TEST_ACTIVITIES } from "../../../fixtures/activities";
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";
import * as _ from "lodash";

let _TEST_ACTIVITIES_: ISyncActivityComputed[] = null;

describe('FitnessService', () => {

	let fitnessService: FitnessService = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [FitnessService]
		});

		_TEST_ACTIVITIES_ = _.cloneDeep(TEST_ACTIVITIES);

		// Retrieve injected service
		fitnessService = TestBed.get(FitnessService);
	});

	it('should be created', (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});
});
