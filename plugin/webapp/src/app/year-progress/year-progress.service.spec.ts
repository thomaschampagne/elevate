import { TestBed } from '@angular/core/testing';

import { YearProgressService } from './year-progress.service';
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";

describe('YearProgressService', () => {

	let _TEST_YEAR_PROGRESS_ACTIVITIES_: SyncedActivityModel[] = null;

	let service: YearProgressService;

	beforeEach(() => {

		_TEST_YEAR_PROGRESS_ACTIVITIES_ = _.clone(YearProgressActivitiesFixture.provide());

		TestBed.configureTestingModule({
			providers: [YearProgressService]
		});

		service = TestBed.get(YearProgressService);

	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});


	it("should compute progression on 2.5 years", (done: Function) => {

		// Given
		const expectedLength = 3;
		const perTypes: string[] = ["Ride", "VirtualRide", "Run"];

		// When
		const progression = service.progression(_TEST_YEAR_PROGRESS_ACTIVITIES_, perTypes);

		// Then
		expect(progression).not.toBeNull();
		expect(progression.length).toEqual(expectedLength);

		expect(progression[0].year).toEqual(2015);
		expect(progression[1].year).toEqual(2016);
		expect(progression[2].year).toEqual(2017);

		expect(progression[0].progressions.length).toEqual(365);
		expect(progression[1].progressions.length).toEqual(366);
		expect(progression[2].progressions.length).toEqual(152);

		done();
	});
	/*

        it("should _method_name_ return _describe_data_", (done: Function) => {

            // Given

            // When

            // Then

            done();
        });


        it("should _method_name_ return _describe_data_", (done: Function) => {

            // Given

            // When

            // Then

            done();
        });
    */


});
