import { TestBed } from "@angular/core/testing";

import { YearProgressService } from "./year-progress.service";
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import { YearProgressModel } from "../models/year-progress.model";
import * as _ from "lodash";
import { ActivityCountByTypeModel } from "../models/activity-count-by-type.model";
import { ProgressionModel } from "../models/progression.model";
import * as moment from "moment";
import { Moment } from "moment";
import { ProgressionAtDayModel } from "../models/progression-at-date.model";
import { ProgressType } from "../models/progress-type.enum";
import { SyncedActivityModel } from "@elevate/shared/models";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { YearProgressModule } from "../../year-progress.module";
import { AppError } from "../../../shared/models/app-error.model";
import { TargetProgressionModel } from "../models/target-progression.model";

describe("YearProgressService", () => {

	let yearProgressService: YearProgressService;
	let TEST_SYNCED_MODELS: SyncedActivityModel[];

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				YearProgressModule
			]
		});

		yearProgressService = TestBed.get(YearProgressService);

		TEST_SYNCED_MODELS = YearProgressActivitiesFixture.provide();

		spyOn(yearProgressService, "getTodayMoment").and.returnValue(moment("2018-03-01 12:00", "YYYY-MM-DD hh:mm"));

		done();
	});

	it("should be created", (done: Function) => {

		expect(yearProgressService).toBeTruthy();
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
		const result: ActivityCountByTypeModel[] = yearProgressService.activitiesByTypes(TEST_SYNCED_MODELS);

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
		const result: number[] = yearProgressService.availableYears(TEST_SYNCED_MODELS);

		// Then
		expect(result).not.toBeNull();
		expect(result).toEqual(expectedResult);

		done();

	});

	it("should notify subscribers when moment watched has changed", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(yearProgressService.momentWatchedChanges, "next");
		const momentWatched: Moment = moment("2017-04-29 12:00", "YYYY-MM-DD hh:mm");
		yearProgressService.momentWatched = null;

		// When
		yearProgressService.onMomentWatchedChange(momentWatched);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(momentWatched);
		expect(yearProgressService.momentWatched).toEqual(momentWatched);
		done();
	});

	describe("compute progression", () => {

		it("should compute progression on 4 years", (done: Function) => {

			// Given
			const expectedLength = 4;
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			expect(progression).not.toBeNull();
			expect(progression.length).toEqual(expectedLength);
			expect(_.last(progression).year).toEqual(2018);

			expect(progression[0].year).toEqual(2015);
			expect(progression[1].year).toEqual(2016);
			expect(progression[2].year).toEqual(2017);
			expect(progression[3].year).toEqual(2018);

			expect(progression[0].progressions.length).toEqual(365);
			expect(progression[1].progressions.length).toEqual(366);
			expect(progression[2].progressions.length).toEqual(365);
			expect(progression[3].progressions.length).toEqual(365);

			done();

		});

		it("should compute progression by tagging future days of current year", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			const yearProgressModel_2018 = progression[3];

			const pastDaysCount_2018 = _.filter(yearProgressModel_2018.progressions, {isFuture: false}).length;
			expect(pastDaysCount_2018).toEqual(60);

			const futureDaysCount_2018 = _.filter(yearProgressModel_2018.progressions, {isFuture: true}).length;
			expect(futureDaysCount_2018).toEqual(305);

			done();
		});

		it("should compute progression on 4 years even with a walk done the 2016-06-06", (done: Function) => {

			// Given
			const expectedLength = 4;
			const typesFilter: string[] = ["Walk"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

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
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			expect(progression).not.toBeNull();
			expect(progression.length).toEqual(expectedLength);

			expect(progression[0].year).toEqual(2015);
			expect(progression[1].year).toEqual(2016);
			expect(progression[2].year).toEqual(2017);
			expect(progression[3].year).toEqual(2018);

			expect(progression[0].progressions.length).toEqual(365);
			expect(progression[1].progressions.length).toEqual(366);
			expect(progression[2].progressions.length).toEqual(365);
			expect(progression[3].progressions.length).toEqual(365);

			done();

		});

		it("should compute progression with proper totals metrics", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

			const expectedFirstDay2015 = new ProgressionModel(2015,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2015 = new ProgressionModel(2015,
				365,
				6205,
				788400 / 3600, // = Hours
				70080,
				292
			);

			const expectedFirstDay2016 = new ProgressionModel(2016,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2016 = new ProgressionModel(2016,
				366,
				6215,
				792000 / 3600, // = Hours
				70130,
				293
			);

			const expectedFirstDay2017 = new ProgressionModel(2017,
				1,
				10,
				3600 / 3600, // = Hours
				50,
				1
			);

			const expectedLastDay2017 = new ProgressionModel(2017,
				365,
				2580,
				329400 / 3600, // = Hours
				29250,
				122
			);

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

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

		it("should compute progression without commute rides and with proper totals metrics", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = false;
			const includeIndoorRide = true;

			const expectedLastDay2015 = new ProgressionModel(2015,
				365,
				5110,
				657000 / 3600, // = Hours
				69350,
				219
			);

			const expectedLastDay2016 = new ProgressionModel(2016,
				366,
				5120,
				660600 / 3600, // = Hours
				69400,
				220
			);
			const expectedLastDay2017 = new ProgressionModel(2017,
				365,
				2130,
				275400 / 3600, // = Hours
				28950,
				92
			);

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			expect(progression).not.toBeNull();

			const lastDay2015 = _.last(progression[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2016 = _.last(progression[1].progressions);
			expect(lastDay2016).toEqual(expectedLastDay2016);

			const lastDay2017 = _.last(progression[2].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should compute progression with imperial system unit", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = false;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

			const expectedLastDay2015 = new ProgressionModel(2015,
				365,
				3856, // Miles
				788400 / 3600, // = Hours
				229921, // Feet
				292
			);

			const expectedLastDay2016 = new ProgressionModel(2016,
				366,
				3862, // Miles
				792000 / 3600, // = Hours
				230085, // Feet
				293
			);

			const expectedLastDay2017 = new ProgressionModel(2017,
				365,
				1603, // Miles
				329400 / 3600, // = Hours
				95965, // Feet
				122
			);

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			expect(progression).not.toBeNull();

			const lastDay2015 = _.last(progression[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2016 = _.last(progression[1].progressions);
			expect(lastDay2016).toEqual(expectedLastDay2016);

			const lastDay2017 = _.last(progression[2].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should compute progression with only provided years", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = [2015, 2017]; // Skip 2016
			const isMetric = true;
			const includeCommuteRide = false;
			const includeIndoorRide = false;

			const expectedLastDay2015 = new ProgressionModel(2015,
				365,
				5110,
				657000 / 3600, // = Hours
				69350,
				219
			);

			const expectedLastDay2017 = new ProgressionModel(2017,
				365,
				2130,
				275400 / 3600, // = Hours
				28950,
				92
			);

			// When
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// Then
			expect(progression).not.toBeNull();

			const lastDay2015 = _.last(progression[0].progressions);
			expect(lastDay2015).toEqual(expectedLastDay2015);

			const lastDay2017 = _.last(progression[1].progressions);
			expect(lastDay2017).toEqual(expectedLastDay2017);

			done();

		});

		it("should not compute progression with empty activities", (done: Function) => {

			// Given
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const syncedActivityModels = [];
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;

			const progressionMethodCall = () => yearProgressService.yearProgression(syncedActivityModels,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);


			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_SYNCED_ACTIVITY_MODELS);

			done();

		});

		it("should not compute progression with empty types filters", (done: Function) => {

			// Given
			const typesFilter: string[] = [];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;
			const progressionMethodCall = () => yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_TYPES_FILTER);

			done();

		});

		it("should not compute progression with not existing type", (done: Function) => {

			// Given
			const typesFilter: string[] = ["FakeType"];
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;
			const yearsFilter: number[] = []; // All
			const progressionMethodCall = () => yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

			// When, Then
			expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_YEAR_PROGRESS_MODELS);

			done();

		});

		it("should give progressions for a specific day", (done: Function) => {

			// Given
			const expectedLength = 4;
			const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
			const yearsFilter: number[] = []; // All
			const isMetric = true;
			const includeCommuteRide = true;
			const includeIndoorRide = true;
			const progression: YearProgressModel[] = yearProgressService.yearProgression(TEST_SYNCED_MODELS,
				typesFilter,
				yearsFilter,
				isMetric,
				includeCommuteRide,
				includeIndoorRide);

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
			const progressionAtDayModels: ProgressionAtDayModel[] = yearProgressService.findProgressionsAtDay(progression, dayMoment, progressType, selectedYears, yearsColorsMap);

			// Then
			expect(progressionAtDayModels).not.toBeNull();
			expect(progressionAtDayModels.length).toEqual(expectedLength);

			expect(progressionAtDayModels[3].year).toEqual(2015);
			expect(progressionAtDayModels[3].date.getFullYear()).toEqual(2015);
			expect(moment(progressionAtDayModels[3].date).dayOfYear()).toEqual(152);
			expect(progressionAtDayModels[3].value).toEqual(2580);
			expect(progressionAtDayModels[3].color).toEqual("red");

			expect(progressionAtDayModels[2].year).toEqual(2016);
			expect(progressionAtDayModels[2].date.getFullYear()).toEqual(2016);
			expect(moment(progressionAtDayModels[2].date).dayOfYear()).toEqual(153);
			expect(progressionAtDayModels[2].value).toEqual(2595);

			expect(progressionAtDayModels[1].year).toEqual(2017);
			expect(progressionAtDayModels[1].date.getFullYear()).toEqual(2017);
			expect(moment(progressionAtDayModels[1].date).dayOfYear()).toEqual(152);
			expect(progressionAtDayModels[1].value).toEqual(2580);

			expect(progressionAtDayModels[0].year).toEqual(2018);
			expect(progressionAtDayModels[0].date.getFullYear()).toEqual(2018);
			expect(moment(progressionAtDayModels[0].date).dayOfYear()).toEqual(152);
			expect(progressionAtDayModels[0].value).toEqual(0);
			expect(progressionAtDayModels[0].color).toEqual("purple");

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
			const targetProgressionModels: TargetProgressionModel[] = yearProgressService.targetProgression(year, targetValue);

			// Then
			expect(targetProgressionModels).not.toBeNull();
			expect(targetProgressionModels.length).toEqual(expectedTargetProgressionLength);
			expect(_.floor(targetProgressionModels[1].value - targetProgressionModels[0].value, 3)).toEqual(expectedStep);

			done();
		});

		it("should compute target progression on leap year", (done: Function) => {

			// Given
			const year = 2016;
			const targetValue = 5000;
			const expectedTargetProgressionLength = 366;
			const expectedStep = 13.661;

			// When
			const targetProgressionModels: TargetProgressionModel[] = yearProgressService.targetProgression(year, targetValue);

			// Then
			expect(targetProgressionModels).not.toBeNull();
			expect(targetProgressionModels.length).toEqual(expectedTargetProgressionLength);
			expect(_.floor(targetProgressionModels[1].value - targetProgressionModels[0].value, 3)).toEqual(expectedStep);

			done();
		});

	});

	describe("format human readable time", () => {

		it("should format 24 hours to human readable time", (done: Function) => {

			// Given
			const hours = 24;
			const expected = "24 h";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 24 hours to human readable time", (done: Function) => {

			// Given
			const hours = 1;
			const expected = "1 h";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 50 hours to human readable time", (done: Function) => {

			// Given
			const hours = 50;
			const expected = "50 h";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 76.25 hours to human readable time", (done: Function) => {

			// Given
			const hours = 76.25;
			const expected = "76 h, 15 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 29.5 hours to human readable time", (done: Function) => {

			// Given
			const hours = 29.5;
			const expected = "29 h, 30 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 15 hours to human readable time", (done: Function) => {

			// Given
			const hours = 15;
			const expected = "15 h";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 5.815 hours to human readable time", (done: Function) => {

			// Given
			const hours = 5.815;
			const expected = "5 h, 49 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 15.3333333 hours to human readable time", (done: Function) => {

			// Given
			const hours = 15.3333333;
			const expected = "15 h, 20 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 0.25 hours to human readable time", (done: Function) => {

			// Given
			const hours = 0.25;
			const expected = "15 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format -12.5 negative hours to human readable time", (done: Function) => {

			// Given
			const hours = -12.5;
			const expected = "12 h, 30 min";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

			// Then
			expect(result).toEqual(expected);
			done();
		});

		it("should format 0 hours to human readable time", (done: Function) => {

			// Given
			const hours = 0;
			const expected = "0 h";

			// When
			const result: string = yearProgressService.readableTimeProgress(hours);

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

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(expected));

			// When
			const promise: Promise<YearProgressPresetModel[]> = yearProgressService.fetchPresets();

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

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(yearProgressService.yearProgressDao, "savePresets")
				.and.returnValue(Promise.resolve(expected));

			// When
			const promise: Promise<YearProgressPresetModel[]> = yearProgressService.addPreset(modelToBeAdded);

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

			const expectedErrorMessage = "You already saved this preset. You may load it instead.";

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(yearProgressService.yearProgressDao, "savePresets").and.callThrough();

			// When
			const promise: Promise<YearProgressPresetModel[]> = yearProgressService.addPreset(modelToBeAdded);

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

			const expectedErrorMessage = "You already saved this preset. You may load it instead.";

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(yearProgressService.yearProgressDao, "savePresets").and.callThrough();

			// When
			const promise: Promise<YearProgressPresetModel[]> = yearProgressService.addPreset(modelToBeAdded);

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

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(yearProgressService.yearProgressDao, "savePresets")
				.and.returnValue(Promise.resolve());

			const index = 1;

			// When
			const promise: Promise<void> = yearProgressService.deletePreset(index);

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

			const fetchDaoSpy = spyOn(yearProgressService.yearProgressDao, "fetchPresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const saveDaoSpy = spyOn(yearProgressService.yearProgressDao, "savePresets")
				.and.returnValue(Promise.resolve(progressPresetModels));

			const index = 99; // Fake index

			// When
			const promise: Promise<void> = yearProgressService.deletePreset(index);

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
