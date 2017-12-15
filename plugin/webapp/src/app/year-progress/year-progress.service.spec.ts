import { TestBed } from '@angular/core/testing';

import { YearProgressService } from './year-progress.service';
import { TEST_YEAR_PROGRESS_ACTIVITIES } from "./year-progress-activities.fixture";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";

describe('YearProgressService', () => {

	let _TEST_YEAR_PROGRESS_ACTIVITIES_: SyncedActivityModel[] = null;

	let service: YearProgressService;

	beforeEach(() => {

		_TEST_YEAR_PROGRESS_ACTIVITIES_ = _.clone(TEST_YEAR_PROGRESS_ACTIVITIES);

		TestBed.configureTestingModule({
			providers: [YearProgressService]
		});

		service = TestBed.get(YearProgressService);

	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});


	it("should compute progression on 3 years", (done: Function) => {

		// Given
		const expectedLength = 3;

		// When
		const result = service.compute(_TEST_YEAR_PROGRESS_ACTIVITIES_);

		// Then
		expect(result).not.toBeNull();
		expect(result.length).toEqual(expectedLength);

		done();
	});

});
