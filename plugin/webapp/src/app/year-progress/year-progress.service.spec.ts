import { TestBed } from '@angular/core/testing';

import { YearProgressService } from './year-progress.service';
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";

describe('YearProgressService', () => {

	let _TEST_YEAR_PROGRESS_ACTIVITIES_: SyncedActivityModel[] = null;

	let service: YearProgressService;

	beforeEach((done: Function) => {

		_TEST_YEAR_PROGRESS_ACTIVITIES_ = YearProgressActivitiesFixture.provide();

		TestBed.configureTestingModule({
			providers: [YearProgressService]
		});

		service = TestBed.get(YearProgressService);
		done();
	});

	it("should be created", (done: Function) => {

		expect(service).toBeTruthy();
		done();
	});


	it("should compute progression on ~2.5 years", (done: Function) => {


		// Given
		const expectedLength = 3;
		const typesFilters: string[] = ["Ride", "VirtualRide", "Run"];

		// When
		const progression = service.progression(_TEST_YEAR_PROGRESS_ACTIVITIES_, typesFilters);

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


	it("should compute progression with proper totals metrics", (done: Function) => {


		// Given
		const typesFilters: string[] = ["Ride", "VirtualRide", "Run"];

		const expectedFirstDay2015 = {
			onTimestamp: 1420066800000,
			onYear: 2015,
			onDayOfYear: 1,
			totalDistance: 10000,
			totalTime: 3600,
			totalElevation: 50,
			count: 1
		};

		const expectedLastDay2015 = {
			onTimestamp: 1451516400000,
			onYear: 2015,
			onDayOfYear: 365,
			totalDistance: 6205000,
			totalTime: 788400,
			totalElevation: 70080,
			count: 292
		};

		const expectedFirstDay2016 = {
			onTimestamp: 1451602800000,
			onYear: 2016,
			onDayOfYear: 1,
			totalDistance: 10000,
			totalTime: 3600,
			totalElevation: 50,
			count: 1
		};

		const expectedLastDay2016 = {
			onTimestamp: 1483138800000,
			onYear: 2016,
			onDayOfYear: 366,
			totalDistance: 6215000,
			totalTime: 792000,
			totalElevation: 70130,
			count: 293
		};

		const expectedFirstDay2017 = {
			onTimestamp: 1483225200000,
			onYear: 2017,
			onDayOfYear: 1,
			totalDistance: 10000,
			totalTime: 3600,
			totalElevation: 50,
			count: 1
		};

		const expectedLastDay2017 = {
			onTimestamp: 1496268000000,
			onYear: 2017,
			onDayOfYear: 152,
			totalDistance: 2580000,
			totalTime: 329400,
			totalElevation: 29250,
			count: 122
		};

		// When
		const progression = service.progression(_TEST_YEAR_PROGRESS_ACTIVITIES_, typesFilters);

		// Then
		expect(progression).not.toBeNull();

		const firstDay2015 = _.first(progression[0].progressions);
		const lastDay2015 = _.last(progression[0].progressions);
		expect(firstDay2015).toEqual(expectedFirstDay2015);
		expect(lastDay2015).toEqual(expectedLastDay2015);

		const firstDay2016 = _.first(progression[1].progressions);
		const lastDay2016 = _.last(progression[1].progressions);
		expect(firstDay2016).toEqual(expectedFirstDay2016);
		expect(lastDay2016).toEqual(expectedLastDay2016);

		const firstDay2017 = _.first(progression[2].progressions);
		const lastDay2017 = _.last(progression[2].progressions);
		expect(firstDay2017).toEqual(expectedFirstDay2017);
		expect(lastDay2017).toEqual(expectedLastDay2017);

		done();
	});

});
