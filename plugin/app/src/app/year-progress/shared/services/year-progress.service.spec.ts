import { TestBed } from "@angular/core/testing";

import { YearProgressService } from "./year-progress.service";
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import { YearProgressModel } from "../models/year-progress.model";
import * as _ from "lodash";
import { ActivityCountByTypeModel } from "../models/activity-count-by-type.model";
import { ProgressModel } from "../models/progress.model";
import * as moment from "moment";
import { Moment } from "moment";
import { ProgressAtDayModel } from "../models/progress-at-date.model";
import { ProgressType } from "../enums/progress-type.enum";
import { SyncedActivityModel } from "@elevate/shared/models";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { YearProgressModule } from "../../year-progress.module";
import { AppError } from "../../../shared/models/app-error.model";
import { TargetProgressModel } from "../models/target-progress.model";
import { DataStore } from "../../../shared/data-store/data-store";
import { MockedDataStore } from "../../../shared/data-store/impl/spec/mocked-data-store.service";
import { ProgressMode } from "../enums/progress-mode.enum";
import { StandardProgressConfigModel } from "../models/standard-progress-config.model";
import { RollingProgressConfigModel } from "../models/rolling-progress-config.model";
import Spy = jasmine.Spy;

describe("YearProgressService", () => {

	/**
	 * @param date YYYY-MM-DD
	 * @return Strava start_time format
	 */
	const stravaStartTime = (date: string) => {
		return date + "T11:00:00+0000";
	};

	let service: YearProgressService;
	let TEST_SYNCED_MODELS: SyncedActivityModel[];
	let getTodayMomentSpy: Spy;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<YearProgressPresetModel> = new MockedDataStore();

		TestBed.configureTestingModule({
			imports: [
				YearProgressModule
			],
			providers: [
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		service = TestBed.get(YearProgressService);

		TEST_SYNCED_MODELS = YearProgressActivitiesFixture.provide();

		getTodayMomentSpy = spyOn(service, "getTodayMoment");
		getTodayMomentSpy.and.returnValue(moment("2018-03-01 12:00", "YYYY-MM-DD hh:mm"));

		done();
	});

	it("should be created", (done: Function) => {

		expect(service).toBeTruthy();
		done();
	});

	it("should provide activities count by types", (done: Function) => {

		// Given
		const expectedResult: ActivityCountByTypeModel[] = [
			{type: "Ride", count: 352},
			{type: "Run", count: 178},
			{type: "VirtualRide", count: 177}
		];

		// When
		const result: ActivityCountByTypeModel[] = service.activitiesByTypes(TEST_SYNCED_MODELS);

		// Then
		expect(result).not.toBeNull();
		expect(result).toEqual(expectedResult);

		// Check order
		expect(_.first(result).type).toEqual("Ride");
		expect(result[1].type).toEqual("Run");
		expect(_.last(result).type).toEqual("VirtualRide");

		done();

	});

	it("should provide all available years from user activities", (done: Function) => {

		// Given
		const expectedResult: number[] = [2018, 2017, 2016, 2015];

		// When
		const result: number[] = service.availableYears(TEST_SYNCED_MODELS);

		// Then
		expect(result).not.toBeNull();
		expect(result).toEqual(expectedResult);

		done();

	});

	it("should notify subscribers when moment watched has changed", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.momentWatchedChanges, "next");
		const momentWatched: Moment = moment("2017-04-29 12:00", "YYYY-MM-DD hh:mm");
		service.momentWatched = null;

		// When
		service.onMomentWatchedChange(momentWatched);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(momentWatched);
		expect(service.momentWatched).toEqual(momentWatched);
		done();
	});

	describe("compute cumulative progression", () => {

		it("should compute progression on 4 years", (done: Function) => {

			// Given
			const expectedLength = 4;

			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], /* All*/ true, true, true);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedLength);
			expect(_.last(yearProgressions).year).toEqual(2018);
			expect(_.last(yearProgressions).mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);

			expect(yearProgressions[0].year).toEqual(2015);
			expect(yearProgressions[1].year).toEqual(2016);
			expect(yearProgressions[2].year).toEqual(2017);
			expect(yearProgressions[3].year).toEqual(2018);

			expect(yearProgressions[0].progressions.length).toEqual(365);
			expect(yearProgressions[1].progressions.length).toEqual(366);
			expect(yearProgressions[2].progressions.length).toEqual(365);
			expect(yearProgressions[3].progressions.length).toEqual(365);

			done();

		});

		it("should compute progression by tagging future days of current year", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], true, true, true);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			const yearProgressModel_2018 = yearProgressions[3];
			expect(yearProgressModel_2018.mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);

			const pastDaysCount_2018 = _.filter(yearProgressModel_2018.progressions, {isFuture: false}).length;
			expect(pastDaysCount_2018).toEqual(60);

			const futureDaysCount_2018 = _.filter(yearProgressModel_2018.progressions, {isFuture: true}).length;
			expect(futureDaysCount_2018).toEqual(305);

			done();
		});

		it("should compute progression on 4 years even with a walk done the 2016-06-06", (done: Function) => {

			// Given
			const expectedLength = 4;
			const progressConfig = new StandardProgressConfigModel(["Walk"], [], true, true, true);

			const fakeWalkActivity = new SyncedActivityModel();
			fakeWalkActivity.id = 99;
			fakeWalkActivity.name = "Walking";
			fakeWalkActivity.type = "Walk";
			fakeWalkActivity.display_type = "Walk";
			fakeWalkActivity.start_time = moment("2016-06-06", "YYYY-MM-DD").toISOString();
			fakeWalkActivity.distance_raw = 3000;
			fakeWalkActivity.moving_time_raw = 3600;
			fakeWalkActivity.elapsed_time_raw = 3600;
			fakeWalkActivity.elevation_gain_raw = 0;

			TEST_SYNCED_MODELS.push(fakeWalkActivity);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedLength);

			expect(yearProgressions[0].mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);
			expect(yearProgressions[1].mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);
			expect(yearProgressions[2].mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);
			expect(yearProgressions[3].mode).toEqual(ProgressMode.STANDARD_CUMULATIVE);

			expect(yearProgressions[0].year).toEqual(2015);
			expect(yearProgressions[1].year).toEqual(2016);
			expect(yearProgressions[2].year).toEqual(2017);
			expect(yearProgressions[3].year).toEqual(2018);

			expect(yearProgressions[0].progressions.length).toEqual(365);
			expect(yearProgressions[1].progressions.length).toEqual(366);
			expect(yearProgressions[2].progressions.length).toEqual(365);
			expect(yearProgressions[3].progressions.length).toEqual(365);

			done();

		});

		it("should compute progression with proper totals metrics", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], true, true, true);

			const expectedFirstDay2015 = new ProgressModel(2015,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2015 = new ProgressModel(2015,
				365,
				6205,
				788400 / 3600, // = Hours
				70080,
				292
			);

			const expectedFirstDay2016 = new ProgressModel(2016,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2016 = new ProgressModel(2016,
				366,
				6215,
				792000 / 3600, // = Hours
				70130,
				293
			);

			const expectedFirstDay2017 = new ProgressModel(2017,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2017 = new ProgressModel(2017,
				365,
				2580,
				329400 / 3600, // = Hours
				29250,
				122
			);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();

			const firstDay2015 = _.first(yearProgressions[0].progressions);
			const lastDay2015 = _.last(yearProgressions[0].progressions);
			expect(firstDay2015).toEqual(expectedFirstDay2015);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const firstDay2016 = _.first(yearProgressions[1].progressions);
			const lastDay2016 = _.last(yearProgressions[1].progressions);
			expect(firstDay2016).toEqual(expectedFirstDay2016);
			expect(lastDay2016).toEqual(expectedLastDay2016);

			const firstDay2017 = _.first(yearProgressions[2].progressions);
			const lastDay2017 = _.last(yearProgressions[2].progressions);
			expect(firstDay2017).toEqual(expectedFirstDay2017);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should compute progression without commute rides and with proper totals metrics", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], true, false, true);

			const expectedLastDay2015 = new ProgressModel(2015,
				365,
				5110,
				657000 / 3600, // = Hours
				69350,
				219
			);

			const expectedLastDay2016 = new ProgressModel(2016,
				366,
				5120,
				660600 / 3600, // = Hours
				69400,
				220
			);
			const expectedLastDay2017 = new ProgressModel(2017,
				365,
				2130,
				275400 / 3600, // = Hours
				28950,
				92
			);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();

			const lastDay2015 = _.last(yearProgressions[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2016 = _.last(yearProgressions[1].progressions);
			expect(lastDay2016).toEqual(expectedLastDay2016);

			const lastDay2017 = _.last(yearProgressions[2].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should compute progression with imperial system unit", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], false, true, true);

			const expectedLastDay2015 = new ProgressModel(2015,
				365,
				3856, // Miles
				788400 / 3600, // = Hours
				229921, // Feet
				292
			);

			const expectedLastDay2016 = new ProgressModel(2016,
				366,
				3862, // Miles
				792000 / 3600, // = Hours
				230085, // Feet
				293
			);

			const expectedLastDay2017 = new ProgressModel(2017,
				365,
				1603, // Miles
				329400 / 3600, // = Hours
				95965, // Feet
				122
			);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();

			const lastDay2015 = _.last(yearProgressions[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2016 = _.last(yearProgressions[1].progressions);
			expect(lastDay2016).toEqual(expectedLastDay2016);

			const lastDay2017 = _.last(yearProgressions[2].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should compute progression with only provided years", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [2015, 2017], /* Skip 2016,*/ true, false, false);

			const expectedLastDay2015 = new ProgressModel(2015,
				365,
				5110,
				657000 / 3600, // = Hours
				69350,
				219
			);

			const expectedLastDay2017 = new ProgressModel(2017,
				365,
				2130,
				275400 / 3600, // = Hours
				28950,
				92
			);

			// When
			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// Then
			expect(yearProgressions).not.toBeNull();

			const lastDay2015 = _.last(yearProgressions[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2017 = _.last(yearProgressions[1].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should not compute progression with empty activities", (done: Function) => {

			// Given
			const syncedActivityModels = [];

			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], true, true, true);

			const progressionMethodCall = () => service.progressions(progressConfig, syncedActivityModels);


			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_SYNCED_ACTIVITY_MODELS);

			done();

		});

		it("should not compute progression with empty types filters", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel([], [], true, true, true);

			const progressionMethodCall = () => service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_TYPES_FILTER);

			done();

		});

		it("should not compute progression with not existing type", (done: Function) => {

			// Given
			const progressConfig = new StandardProgressConfigModel(["FakeType"], [], true, true, true);

			const progressionMethodCall = () => service.progressions(progressConfig, TEST_SYNCED_MODELS);

			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_YEAR_PROGRESS_MODELS);

			done();

		});

		it("should give progressions for a specific day", (done: Function) => {

			// Given
			const expectedLength = 4;
			const progressConfig = new StandardProgressConfigModel(["Ride", "VirtualRide", "Run"], [], true, true, true);

			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, TEST_SYNCED_MODELS);

			const selectedYears: number[] = [2018, 2017, 2016, 2015];

			const progressType = ProgressType.DISTANCE;

			const todayDate = "2016-06-01 12:00";
			const momentDatePattern = "YYYY-MM-DD hh:mm";
			const dayMoment = moment(todayDate, momentDatePattern).startOf("day");

			const yearsColorsMap = new Map<number, string>();
			yearsColorsMap.set(2015, "red");
			yearsColorsMap.set(2016, "blue");
			yearsColorsMap.set(2017, "green");
			yearsColorsMap.set(2018, "purple");

			// When
			const progressAtDayModels: ProgressAtDayModel[] = service.findProgressionsAtDay(yearProgressions, dayMoment, progressType, selectedYears, yearsColorsMap);

			// Then
			expect(progressAtDayModels).not.toBeNull();
			expect(progressAtDayModels.length).toEqual(expectedLength);

			expect(progressAtDayModels[3].year).toEqual(2015);
			expect(progressAtDayModels[3].date.getFullYear()).toEqual(2015);
			expect(moment(progressAtDayModels[3].date).dayOfYear()).toEqual(152);
			expect(progressAtDayModels[3].value).toEqual(2580);
			expect(progressAtDayModels[3].color).toEqual("red");

			expect(progressAtDayModels[2].year).toEqual(2016);
			expect(progressAtDayModels[2].date.getFullYear()).toEqual(2016);
			expect(moment(progressAtDayModels[2].date).dayOfYear()).toEqual(153);
			expect(progressAtDayModels[2].value).toEqual(2595);

			expect(progressAtDayModels[1].year).toEqual(2017);
			expect(progressAtDayModels[1].date.getFullYear()).toEqual(2017);
			expect(moment(progressAtDayModels[1].date).dayOfYear()).toEqual(152);
			expect(progressAtDayModels[1].value).toEqual(2580);

			expect(progressAtDayModels[0].year).toEqual(2018);
			expect(progressAtDayModels[0].date.getFullYear()).toEqual(2018);
			expect(moment(progressAtDayModels[0].date).dayOfYear()).toEqual(152);
			expect(progressAtDayModels[0].value).toEqual(0);
			expect(progressAtDayModels[0].color).toEqual("purple");

			done();

		});

	});

	describe("compute rolling cumulative progression", () => {

		let syncedActivityModels: Partial<SyncedActivityModel>[] = [];

		const createActivity = (date: string, type: string, distance_raw: number, moving_time_raw: number, elevation_gain_raw: number) => {
			return {
				distance_raw: distance_raw,
				moving_time_raw: moving_time_raw,
				elevation_gain_raw: elevation_gain_raw,
				start_time: stravaStartTime(date),
				type: type
			};
		};

		beforeEach((done: Function) => {
			syncedActivityModels = [];
			done();
		});

		it("should calculate 1 week rolling distance cumulative progression (no previous year)", (done: Function) => {

			// Given
			const expectedYearsLength = 1;
			const expectedYear = 2019;
			const expectedDaysInYear = 365;
			const rollingDays = moment.duration(1, "week").asDays();
			const progressConfig = new RollingProgressConfigModel(["Ride"], [], true, true, true, rollingDays);

			const todayTime = "2019-02-15 20:00";
			getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

			/* History definition */
			syncedActivityModels.push(createActivity("2019-02-01", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-02", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-03", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-04", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-05", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-06", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-07", "Ride", 10000, 3600, 100));
			/* (Rest) 2019-02-08 */
			/* (Rest) 2019-02-09 */
			/* (Rest) 2019-02-10 */
			/* (Rest) 2019-02-11 */
			/* (Rest) 2019-02-12 */
			/* (Rest) 2019-02-13 */
			/* (Rest) 2019-02-14 */
			/* (Rest) 2019-02-15 */
			/* (Rest) 2019-02-16 */
			/* ... */

			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, syncedActivityModels as SyncedActivityModel[]);

			// Then
			/* Common checks */
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedYearsLength);

			const yearProgressModel = yearProgressions[0];
			const rollingWeekProgress = yearProgressModel.progressions;

			expect(yearProgressModel.mode).toEqual(ProgressMode.ROLLING_CUMULATIVE);
			expect(yearProgressModel.year).toEqual(expectedYear);
			expect(rollingWeekProgress.length).toEqual(expectedDaysInYear);
			expect(rollingWeekProgress[0].year).toEqual(expectedYear);
			expect(rollingWeekProgress[0].dayOfYear).toEqual(1);

			/* Rolling cumulative checks */
			const januaryDaysOffset = 31;
			expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].distance).toEqual(10);
			expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].distance).toEqual(20);
			expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].distance).toEqual(30);
			expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].distance).toEqual(40);
			expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].distance).toEqual(50);
			expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].distance).toEqual(60);
			expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].distance).toEqual(70);
			expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].distance).toEqual(60);
			expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].distance).toEqual(50);
			expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].distance).toEqual(40);
			expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].distance).toEqual(30);
			expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].distance).toEqual(20);
			expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].distance).toEqual(10);
			expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].distance).toEqual(0);
			expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].distance).toEqual(0);
			expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].distance).toEqual(0);

			done();

		});

		it("should calculate 1 week rolling distance cumulative progression (overlapping between 2 years with activities)", (done: Function) => {

			// Given
			const expectedYearsLength = 2;
			const expectedDaysInYear = 365;
			const rollingDays = moment.duration(1, "week").asDays();
			const progressConfig = new RollingProgressConfigModel(["Ride"], [], true, true, true, rollingDays);

			const todayTime = "2019-02-15 20:00";
			getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

			/* History definition */
			/* 2018 ending */
			syncedActivityModels.push(createActivity("2018-12-25", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-26", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-27", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-28", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-29", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-30", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2018-12-31", "Ride", 10000, 3600, 100));

			/* 2019 beginning */
			syncedActivityModels.push(createActivity("2019-01-01", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-02", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-03", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-04", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-05", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-06", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-01-07", "Ride", 10000, 3600, 100));
			/* (Rest) 2019-01-08 */
			/* (Rest) 2019-01-09 */
			/* (Rest) 2019-01-10 */
			/* (Rest) 2019-01-11 */
			/* (Rest) 2019-01-12 */
			/* (Rest) 2019-01-13 */
			/* (Rest) 2019-01-14 */
			/* (Rest) 2019-01-15 */
			/* (Rest) 2019-01-16 */
			/* ... */

			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, syncedActivityModels as SyncedActivityModel[]);

			// Then
			/* Common checks */
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedYearsLength);

			const previousYearProgress = yearProgressions[0];
			const currentYearProgress = yearProgressions[1];

			expect(previousYearProgress.mode).toEqual(ProgressMode.ROLLING_CUMULATIVE);
			expect(previousYearProgress.year).toEqual(2018);
			expect(currentYearProgress.mode).toEqual(ProgressMode.ROLLING_CUMULATIVE);
			expect(currentYearProgress.year).toEqual(2019);

			const rollingWeekProgressOnPreviousYear = previousYearProgress.progressions;
			const rollingWeekProgressOnCurrentYear = currentYearProgress.progressions;

			expect(rollingWeekProgressOnPreviousYear.length).toEqual(expectedDaysInYear);
			expect(rollingWeekProgressOnPreviousYear[0].year).toEqual(2018);
			expect(rollingWeekProgressOnPreviousYear[0].dayOfYear).toEqual(1);

			expect(rollingWeekProgressOnCurrentYear.length).toEqual(expectedDaysInYear);
			expect(rollingWeekProgressOnCurrentYear[0].year).toEqual(2019);
			expect(rollingWeekProgressOnCurrentYear[0].dayOfYear).toEqual(1);

			/* Rolling distance (km) checks */
			expect(rollingWeekProgressOnPreviousYear[/* Dec 23, 2019 */ expectedDaysInYear - 9].distance).toEqual(0);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 24, 2019 */ expectedDaysInYear - 8].distance).toEqual(0);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 25, 2019 */ expectedDaysInYear - 7].distance).toEqual(10);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 26, 2019 */ expectedDaysInYear - 6].distance).toEqual(20);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 27, 2019 */ expectedDaysInYear - 5].distance).toEqual(30);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 28, 2019 */ expectedDaysInYear - 4].distance).toEqual(40);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 29, 2019 */ expectedDaysInYear - 3].distance).toEqual(50);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 30, 2019 */ expectedDaysInYear - 2].distance).toEqual(60);
			expect(rollingWeekProgressOnPreviousYear[/* Dec 31, 2019 */ expectedDaysInYear - 1].distance).toEqual(70);
			/* ... 2019 switch ... */
			expect(rollingWeekProgressOnCurrentYear[/* Jan 1, 2019 */ 0].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 2, 2019 */ 1].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 3, 2019 */ 2].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 4, 2019 */ 3].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 5, 2019 */ 4].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 6, 2019 */ 5].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 7, 2019 */ 6].distance).toEqual(70);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 8, 2019 */ 7].distance).toEqual(60);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 9, 2019 */ 8].distance).toEqual(50);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 10, 2019 */ 9].distance).toEqual(40);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 11, 2019 */ 10].distance).toEqual(30);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 12, 2019 */ 11].distance).toEqual(20);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 13, 2019 */ 12].distance).toEqual(10);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 14, 2019 */ 13].distance).toEqual(0);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 15, 2019 */ 14].distance).toEqual(0);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 16, 2019 */ 15].distance).toEqual(0);
			expect(rollingWeekProgressOnCurrentYear[/* Jan 17, 2019 */ 16].distance).toEqual(0);

			done();

		});

		it("should calculate 1 week rolling 'distance, time, elevation & count' cumulative progression with multiple activities per day (no previous year)", (done: Function) => {

			// Given
			const expectedYearsLength = 1;
			const expectedYear = 2019;
			const expectedDaysInYear = 365;
			const rollingDays = moment.duration(1, "week").asDays();
			const progressConfig = new RollingProgressConfigModel(["Ride"], [], true, true, true, rollingDays);

			const todayTime = "2019-02-15 20:00";
			getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

			/* History definition */
			syncedActivityModels.push(createActivity("2019-02-01", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-02", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-03", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-04", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-05", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-06", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-07", "Ride", 10000, 3600, 100)); // Double Ride on "2019-02-07"
			syncedActivityModels.push(createActivity("2019-02-07", "Ride", 10000, 3600, 100)); // Double Ride on "2019-02-07"
			/* (Rest) 2019-02-08 */
			/* (Rest) 2019-02-09 */
			/* (Rest) 2019-02-10 */
			/* (Rest) 2019-02-11 */
			/* (Rest) 2019-02-12 */
			/* (Rest) 2019-02-13 */
			/* (Rest) 2019-02-14 */
			/* (Rest) 2019-02-15 */
			/* (Rest) 2019-02-16 */
			/* ... */

			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, syncedActivityModels as SyncedActivityModel[]);

			// Then
			/* Common checks */
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedYearsLength);

			const yearProgressModel = yearProgressions[0];
			const rollingWeekProgress = yearProgressModel.progressions;

			expect(yearProgressModel.mode).toEqual(ProgressMode.ROLLING_CUMULATIVE);
			expect(yearProgressModel.year).toEqual(expectedYear);
			expect(rollingWeekProgress.length).toEqual(expectedDaysInYear);
			expect(rollingWeekProgress[0].year).toEqual(expectedYear);
			expect(rollingWeekProgress[0].dayOfYear).toEqual(1);

			/* Rolling distance (km) cumulative checks */
			const januaryDaysOffset = 31;
			expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].distance).toEqual(10);
			expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].distance).toEqual(20);
			expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].distance).toEqual(30);
			expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].distance).toEqual(40);
			expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].distance).toEqual(50);
			expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].distance).toEqual(60);
			expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].distance).toEqual(80); // Day of double ride
			expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].distance).toEqual(70);
			expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].distance).toEqual(60);
			expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].distance).toEqual(50);
			expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].distance).toEqual(40);
			expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].distance).toEqual(30);
			expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].distance).toEqual(20);
			expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].distance).toEqual(0);
			expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].distance).toEqual(0);
			expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].distance).toEqual(0);

			/* Rolling time cumulative checks */
			expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].time).toEqual(1);
			expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].time).toEqual(2);
			expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].time).toEqual(3);
			expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].time).toEqual(4);
			expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].time).toEqual(5);
			expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].time).toEqual(6);
			expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].time).toEqual(8); // Day of double ride
			expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].time).toEqual(7);
			expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].time).toEqual(6);
			expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].time).toEqual(5);
			expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].time).toEqual(4);
			expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].time).toEqual(3);
			expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].time).toEqual(2);
			expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].time).toEqual(0);
			expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].time).toEqual(0);
			expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].time).toEqual(0);

			/* Rolling elevation cumulative checks */
			expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].elevation).toEqual(100);
			expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].elevation).toEqual(200);
			expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].elevation).toEqual(300);
			expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].elevation).toEqual(400);
			expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].elevation).toEqual(500);
			expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].elevation).toEqual(600);
			expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].elevation).toEqual(800); // Day of double ride
			expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].elevation).toEqual(700);
			expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].elevation).toEqual(600);
			expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].elevation).toEqual(500);
			expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].elevation).toEqual(400);
			expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].elevation).toEqual(300);
			expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].elevation).toEqual(200);
			expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].elevation).toEqual(0);
			expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].elevation).toEqual(0);
			expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].elevation).toEqual(0);

			/* Rolling count cumulative checks */
			expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].count).toEqual(1);
			expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].count).toEqual(2);
			expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].count).toEqual(3);
			expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].count).toEqual(4);
			expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].count).toEqual(5);
			expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].count).toEqual(6);
			expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].count).toEqual(8); // Day of double ride
			expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].count).toEqual(7);
			expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].count).toEqual(6);
			expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].count).toEqual(5);
			expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].count).toEqual(4);
			expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].count).toEqual(3);
			expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].count).toEqual(2);
			expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].count).toEqual(0);
			expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].count).toEqual(0);
			expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].count).toEqual(0);

			done();

		});

		it("should calculate 1 week rolling cumulative progression (with years filters)", (done: Function) => {

			// Given
			const rollingDays = moment.duration(1, "week").asDays();
			const yearsFilter = [2014, 2016, 2017];
			const expectedComputedYears = [2013, 2014, 2015, 2016, 2017]; // 2013 to 2017 needs to be calculated since 2017 can depends from 2013...
			const expectedNotComputedYears = [2018, 2019]; // 2018 & 2019 don't need to be computed since max year in filter is 2017
			const expectedYearsLength = expectedComputedYears.length;
			const progressConfig = new RollingProgressConfigModel(["Ride"], yearsFilter, true, true, true, rollingDays);

			const todayTime = "2018-02-15 20:00";
			getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

			/* History definition: generating year progressions from 2013-01-01 => 2019-12-31 */
			syncedActivityModels.push(createActivity("2013-03-01", "Ride", 10000, 3600, 100));
			syncedActivityModels.push(createActivity("2019-02-15", "Ride", 10000, 3600, 100));

			const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, syncedActivityModels as SyncedActivityModel[]);

			// Then
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions).not.toBeNull();
			expect(yearProgressions.length).toEqual(expectedYearsLength);

			_.forEach(expectedComputedYears, year => {
				expect(_.find(yearProgressions, {year: year})).toBeDefined();
			});

			_.forEach(expectedNotComputedYears, year => {
				expect(_.find(yearProgressions, {year: year})).toBeUndefined();
			});

			done();
		});

	});

	describe("compute target progression", () => {

		it("should compute target progression on non leap year", (done: Function) => {

			// Given
			const year = 2018;
			const targetValue = 5000;
			const expectedTargetProgressionLength = 365;
			const expectedStep = 13.698;

			// When
			const targetProgressModels: TargetProgressModel[] = service.targetProgression(year, targetValue);

			// Then
			expect(targetProgressModels).not.toBeNull();
			expect(targetProgressModels.length).toEqual(expectedTargetProgressionLength);
			expect(_.floor(targetProgressModels[1].value - targetProgressModels[0].value, 3)).toEqual(expectedStep);

			done();
		});

		it("should compute target progression on leap year", (done: Function) => {

			// Given
			const year = 2016;
			const targetValue = 5000;
			const expectedTargetProgressionLength = 366;
			const expectedStep = 13.661;

			// When
			const targetProgressModels: TargetProgressModel[] = service.targetProgression(year, targetValue);

			// Then
			expect(targetProgressModels).not.toBeNull();
			expect(targetProgressModels.length).toEqual(expectedTargetProgressionLength);
			expect(_.floor(targetProgressModels[1].value - targetProgressModels[0].value, 3)).toEqual(expectedStep);

			done();
		});

	});

	describe("format human readable time", () => {

		it("should format 24 hours to human readable time", (done: Function) => {

			// Given
			const hours = 24;
			const expected = "24 h";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 24 hours to human readable time", (done: Function) => {

			// Given
			const hours = 1;
			const expected = "1 h";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 50 hours to human readable time", (done: Function) => {

			// Given
			const hours = 50;
			const expected = "50 h";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 76.25 hours to human readable time", (done: Function) => {

			// Given
			const hours = 76.25;
			const expected = "76 h, 15 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 29.5 hours to human readable time", (done: Function) => {

			// Given
			const hours = 29.5;
			const expected = "29 h, 30 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 15 hours to human readable time", (done: Function) => {

			// Given
			const hours = 15;
			const expected = "15 h";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 5.815 hours to human readable time", (done: Function) => {

			// Given
			const hours = 5.815;
			const expected = "5 h, 49 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 15.3333333 hours to human readable time", (done: Function) => {

			// Given
			const hours = 15.3333333;
			const expected = "15 h, 20 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 0.25 hours to human readable time", (done: Function) => {

			// Given
			const hours = 0.25;
			const expected = "15 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format -12.5 negative hours to human readable time", (done: Function) => {

			// Given
			const hours = -12.5;
			const expected = "12 h, 30 min";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 0 hours to human readable time", (done: Function) => {

			// Given
			const hours = 0;
			const expected = "0 h";

			// When
			const result: string = service.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

	});

	describe("manage presets", () => {

		it("should list presets", (done: Function) => {

			// Given
			const expected: YearProgressPresetModel[] = [
				new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false),
				new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false)
			];

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(expected));

			// When
			const promise: Promise<YearProgressPresetModel[]> = service.fetchPresets();

			// Then
			promise.then((list: YearProgressPresetModel[]) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(list).not.toBeNull();
				expect(list).toEqual(expected);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should add a preset", (done: Function) => {

			// Given
			const modelToBeAdded = new YearProgressPresetModel(ProgressType.DISTANCE, ["Ride", "VirtualRide"], true, true, 5000);

			const progressPresetModels: YearProgressPresetModel[] = [
				new YearProgressPresetModel(ProgressType.DISTANCE, ["Ride", "VirtualRide"], true, true),
				new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false),
				new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], true, true, 5000),
				new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false),
			];

			const expected = _.union(progressPresetModels, [modelToBeAdded]);

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(service.yearProgressPresetDao, "save")
				.and.returnValue(Promise.resolve(expected));

			// When
			const promise: Promise<YearProgressPresetModel[]> = service.addPreset(modelToBeAdded);

			// Then
			promise.then((list: YearProgressPresetModel[]) => {

				expect(list).not.toBeNull();
				expect(saveDaoSpy).toHaveBeenCalledTimes(1);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(list).toEqual(expected);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject adding a preset already existing (with target)", (done: Function) => {

			// Given
			const modelToBeAdded = new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], true, true, 5000);
			const progressPresetModels: YearProgressPresetModel[] = [
				new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false),
				modelToBeAdded,
				new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false),
			];

			const expectedErrorMessage = "You already saved this preset.";

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(service.yearProgressPresetDao, "save").and.callThrough();

			// When
			const promise: Promise<YearProgressPresetModel[]> = service.addPreset(modelToBeAdded);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {

				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS);
				expect(error.message).toEqual(expectedErrorMessage);

				done();
			});

		});

		it("should reject adding a preset already existing (without target)", (done: Function) => {

			// Given
			const modelToBeAdded = new YearProgressPresetModel(ProgressType.DISTANCE, ["Ride", "VirtualRide"], true, true);
			const progressPresetModels: YearProgressPresetModel[] = [
				modelToBeAdded,
				new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false),
				new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], true, true, 5000),
				new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false),
			];

			const expectedErrorMessage = "You already saved this preset.";

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(service.yearProgressPresetDao, "save").and.callThrough();

			// When
			const promise: Promise<YearProgressPresetModel[]> = service.addPreset(modelToBeAdded);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {

				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS);
				expect(error.message).toEqual(expectedErrorMessage);

				done();
			});

		});

		it("should delete preset", (done: Function) => {

			// Given
			const model_0 = new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false);
			const model_1 = new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], true, true, 5000);
			const model_2 = new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false);
			const progressPresetModels: YearProgressPresetModel[] = [
				model_0,
				model_1,
				model_2
			];

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(service.yearProgressPresetDao, "save")
				.and.returnValue(Promise.resolve());

			const index = 1;

			// When
			const promise: Promise<void> = service.deletePreset(index);

			// Then
			promise.then(() => {
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).toHaveBeenCalledWith([model_0, model_2]);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should reject delete preset", (done: Function) => {

			// Given
			const model_0 = new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false);
			const model_1 = new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], true, true, 5000);
			const model_2 = new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false);
			const progressPresetModels: YearProgressPresetModel[] = [
				model_0,
				model_1,
				model_2
			];

			const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "fetch")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(service.yearProgressPresetDao, "save")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const index = 99; // Fake index

			// When
			const promise: Promise<void> = service.deletePreset(index);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, (error: AppError) => {

				expect(error).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(saveDaoSpy).not.toHaveBeenCalled();
				expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_DO_NOT_EXISTS);

				done();
			});

		});


	});

});
