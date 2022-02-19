import { TestBed } from "@angular/core/testing";
import { AppError } from "../../../shared/models/app-error.model";
import { YearProgressService } from "./year-progress.service";
import { RollingProgressConfigModel } from "../models/rolling-progress-config.model";
import { ConsoleLoggerService } from "../../../shared/services/logging/console-logger.service";
import { TargetProgressModel } from "../models/target-progress.model";
import { ProgressAtDayModel } from "../models/progress-at-date.model";
import { YearToDateProgressPresetModel } from "../models/year-to-date-progress-preset.model";
import { YearProgressModel } from "../models/year-progress.model";
import { YearToDateProgressConfigModel } from "../models/year-to-date-progress-config.model";
import { ProgressModel } from "../models/progress.model";
import { RollingProgressPresetModel } from "../models/rolling-progress-preset.model";
import { ProgressType } from "../enums/progress-type.enum";
import { YearProgressModule } from "../../year-progress.module";
import { DataStore } from "../../../shared/data-store/data-store";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { TestingDataStore } from "../../../shared/data-store/testing-datastore.service";
import { YearProgressActivitiesFixture } from "./year-progress-activities.fixture";
import { ProgressMode } from "../enums/progress-mode.enum";
import moment, { Moment } from "moment";
import _ from "lodash";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import Spy = jasmine.Spy;

describe("YearProgressService", () => {
  /**
   * @param date YYYY-MM-DD
   * @return Strava start_time format
   */
  const stravaStartTime = (date: string) => {
    return date + "T11:00:00+0000";
  };

  const isMetric = true;

  let service: YearProgressService;
  let TEST_SYNCED_MODELS: Activity[];
  let getTodayMomentSpy: Spy;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [YearProgressModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: LoggerService, useClass: ConsoleLoggerService }
      ]
    });

    service = TestBed.inject(YearProgressService);

    TEST_SYNCED_MODELS = YearProgressActivitiesFixture.provide();

    getTodayMomentSpy = spyOn(service, "getTodayMoment");
    getTodayMomentSpy.and.returnValue(moment("2018-03-01 12:00", "YYYY-MM-DD hh:mm"));

    done();
  });

  it("should be created", done => {
    expect(service).toBeTruthy();
    done();
  });

  it("should provide all available years from user activities", done => {
    // Given
    const expectedResult: number[] = [2018, 2017, 2016, 2015];

    // When
    const result: number[] = service.availableYears(TEST_SYNCED_MODELS);

    // Then
    expect(result).not.toBeNull();
    expect(result).toEqual(expectedResult);

    done();
  });

  it("should notify subscribers when moment watched has changed", done => {
    // Given
    const expectedCallCount = 1;
    const spy = spyOn(service.momentWatchedChanges$, "next");
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

  describe("compute year to date progression", () => {
    it("should compute progression on 4 years", done => {
      // Given
      const expectedLength = 4;

      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

      // Then
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedLength);
      expect(_.last(yearProgressions).year).toEqual(2018);
      expect(_.last(yearProgressions).mode).toEqual(ProgressMode.YEAR_TO_DATE);

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

    it("should compute progression by tagging future days of current year", done => {
      // Given
      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

      // Then
      const yearProgressModel2018 = yearProgressions[3];
      expect(yearProgressModel2018.mode).toEqual(ProgressMode.YEAR_TO_DATE);

      const pastDaysCount2018 = _.filter(yearProgressModel2018.progressions, { isFuture: false }).length;
      expect(pastDaysCount2018).toEqual(60);

      const futureDaysCount2018 = _.filter(yearProgressModel2018.progressions, { isFuture: true }).length;
      expect(futureDaysCount2018).toEqual(305);

      done();
    });

    it("should compute progression on 4 years even with a walk done the 2016-06-06", done => {
      // Given
      const expectedLength = 4;
      const progressConfig = new YearToDateProgressConfigModel([ElevateSport.Walk], true, true);

      const fakeWalkActivity = new Activity();
      fakeWalkActivity.id = 99;
      fakeWalkActivity.name = "Walking";
      fakeWalkActivity.type = ElevateSport.Walk;
      fakeWalkActivity.startTime = moment("2016-06-06", "YYYY-MM-DD").toISOString();
      fakeWalkActivity.stats = {
        distance: 3000,
        movingTime: 3600,
        elapsedTime: 3600,
        elevationGain: 0
      } as ActivityStats;

      TEST_SYNCED_MODELS.push(fakeWalkActivity);

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

      // Then
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedLength);

      expect(yearProgressions[0].mode).toEqual(ProgressMode.YEAR_TO_DATE);
      expect(yearProgressions[1].mode).toEqual(ProgressMode.YEAR_TO_DATE);
      expect(yearProgressions[2].mode).toEqual(ProgressMode.YEAR_TO_DATE);
      expect(yearProgressions[3].mode).toEqual(ProgressMode.YEAR_TO_DATE);

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

    it("should compute progression with proper totals metrics", done => {
      // Given
      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      const expectedFirstDay2015 = new ProgressModel(
        2015,
        1,
        10,
        3600 / 3600, // = Hours
        50,
        1
      );

      const expectedLastDay2015 = new ProgressModel(
        2015,
        365,
        6205,
        788400 / 3600, // = Hours
        70080,
        292
      );

      const expectedFirstDay2016 = new ProgressModel(
        2016,
        1,
        10,
        3600 / 3600, // = Hours
        50,
        1
      );

      const expectedLastDay2016 = new ProgressModel(
        2016,
        366,
        6215,
        792000 / 3600, // = Hours
        70130,
        293
      );

      const expectedFirstDay2017 = new ProgressModel(
        2017,
        1,
        10,
        3600 / 3600, // = Hours
        50,
        1
      );

      const expectedLastDay2017 = new ProgressModel(
        2017,
        365,
        2580,
        329400 / 3600, // = Hours
        29250,
        122
      );

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

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

    it("should compute progression without commute rides and with proper totals metrics", done => {
      // Given
      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        false,
        true
      );

      const expectedLastDay2015 = new ProgressModel(
        2015,
        365,
        5110,
        657000 / 3600, // = Hours
        69350,
        219
      );

      const expectedLastDay2016 = new ProgressModel(
        2016,
        366,
        5120,
        660600 / 3600, // = Hours
        69400,
        220
      );
      const expectedLastDay2017 = new ProgressModel(
        2017,
        365,
        2130,
        275400 / 3600, // = Hours
        28950,
        92
      );

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

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

    it("should compute progression with imperial system unit", done => {
      // Given
      const isMetricSystem = false;
      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      const expectedLastDay2015 = new ProgressModel(
        2015,
        365,
        3856, // Miles
        788400 / 3600, // = Hours
        229921, // Feet
        292
      );

      const expectedLastDay2016 = new ProgressModel(
        2016,
        366,
        3862, // Miles
        792000 / 3600, // = Hours
        230085, // Feet
        293
      );

      const expectedLastDay2017 = new ProgressModel(
        2017,
        365,
        1603, // Miles
        329400 / 3600, // = Hours
        95965, // Feet
        122
      );

      // When
      const yearProgressions: YearProgressModel[] = service.progressions(
        progressConfig,
        isMetricSystem,
        TEST_SYNCED_MODELS
      );

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

    it("should not compute progression with empty activities", done => {
      // Given
      const activities = [];

      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      const progressionMethodCall = () => service.progressions(progressConfig, isMetric, activities);

      // When, Then
      expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_ACTIVITY_MODELS);

      done();
    });

    it("should not compute progression with empty types filters", done => {
      // Given
      const progressConfig = new YearToDateProgressConfigModel([], true, true);

      const progressionMethodCall = () => service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

      // When, Then
      expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_TYPES_FILTER);

      done();
    });

    it("should not compute progression with not existing type", done => {
      // Given
      const progressConfig = new YearToDateProgressConfigModel(["FakeType" as ElevateSport], true, true);

      const progressionMethodCall = () => service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

      // When, Then
      expect(progressionMethodCall).toThrowError(YearProgressService.ERROR_NO_YEAR_PROGRESS_MODELS);

      done();
    });

    it("should give progressions for a specific day", done => {
      // Given
      const expectedLength = 4;
      const progressConfig = new YearToDateProgressConfigModel(
        [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
        true,
        true
      );

      const yearProgressions: YearProgressModel[] = service.progressions(progressConfig, isMetric, TEST_SYNCED_MODELS);

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
      const progressAtDayModels: ProgressAtDayModel[] = service.findProgressionsAtDay(
        yearProgressions,
        dayMoment,
        progressType,
        selectedYears,
        yearsColorsMap
      );

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

  describe("compute rolling progression", () => {
    let activities: Partial<Activity>[] = [];

    const createActivity = (
      date: string,
      type: ElevateSport,
      distanceRaw: number,
      movingTimeRaw: number,
      elevationGainRaw: number
    ): Activity => {
      const activity = new Activity();

      activity.type = type;
      activity.startTime = stravaStartTime(date);
      activity.stats = {
        distance: distanceRaw,
        movingTime: movingTimeRaw,
        elapsedTime: movingTimeRaw,
        elevationGain: elevationGainRaw
      } as ActivityStats;

      return activity;
    };

    beforeEach(done => {
      activities = [];
      done();
    });

    it("should calculate 1 week rolling distance progression (no previous year)", done => {
      // Given
      const expectedYearsLength = 1;
      const expectedYear = 2019;
      const expectedDaysInYear = 365;
      const rollingDays = moment.duration(1, "week").asDays();
      const progressConfig = new RollingProgressConfigModel([ElevateSport.Ride], true, true, rollingDays);

      const todayTime = "2019-02-15 20:00";
      getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

      /* History definition */
      activities.push(createActivity("2019-02-01", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-02", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-03", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-04", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-05", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-06", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-07", ElevateSport.Ride, 10000, 3600, 100));
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

      const yearProgressions: YearProgressModel[] = service.progressions(
        progressConfig,
        isMetric,
        activities as Activity[]
      );

      // Then
      /* Common checks */
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedYearsLength);

      const yearProgressModel = yearProgressions[0];
      const rollingWeekProgress = yearProgressModel.progressions;

      expect(yearProgressModel.mode).toEqual(ProgressMode.ROLLING);
      expect(yearProgressModel.year).toEqual(expectedYear);
      expect(rollingWeekProgress.length).toEqual(expectedDaysInYear);
      expect(rollingWeekProgress[0].year).toEqual(expectedYear);
      expect(rollingWeekProgress[0].dayOfYear).toEqual(1);

      /* Rolling checks */
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

    it("should calculate 1 week rolling distance progression (overlapping between 2 years with activities)", done => {
      // Given
      const expectedYearsLength = 2;
      const expectedDaysInYear = 365;
      const rollingDays = moment.duration(1, "week").asDays();
      const progressConfig = new RollingProgressConfigModel([ElevateSport.Ride], true, true, rollingDays);

      const todayTime = "2019-02-15 20:00";
      getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

      /* History definition */
      /* 2018 ending */
      activities.push(createActivity("2018-12-25", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-26", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-27", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-28", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-29", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-30", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2018-12-31", ElevateSport.Ride, 10000, 3600, 100));

      /* 2019 beginning */
      activities.push(createActivity("2019-01-01", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-02", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-03", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-04", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-05", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-06", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-01-07", ElevateSport.Ride, 10000, 3600, 100));
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

      const yearProgressions: YearProgressModel[] = service.progressions(
        progressConfig,
        isMetric,
        activities as Activity[]
      );

      // Then
      /* Common checks */
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedYearsLength);

      const previousYearProgress = yearProgressions[0];
      const currentYearProgress = yearProgressions[1];

      expect(previousYearProgress.mode).toEqual(ProgressMode.ROLLING);
      expect(previousYearProgress.year).toEqual(2018);
      expect(currentYearProgress.mode).toEqual(ProgressMode.ROLLING);
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

    it("should calculate 1 week rolling 'distance, time, elevation & count' progression with multiple activities per day (no previous year)", done => {
      // Given
      const expectedYearsLength = 1;
      const expectedYear = 2019;
      const expectedDaysInYear = 365;
      const rollingDays = moment.duration(1, "week").asDays();
      const progressConfig = new RollingProgressConfigModel([ElevateSport.Ride], true, true, rollingDays);

      const todayTime = "2019-02-15 20:00";
      getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

      /* History definition */
      activities.push(createActivity("2019-02-01", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-02", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-03", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-04", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-05", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-06", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-07", ElevateSport.Ride, 10000, 3600, 100)); // Double Ride on "2019-02-07"
      activities.push(createActivity("2019-02-07", ElevateSport.Ride, 10000, 3600, 100)); // Double Ride on "2019-02-07"
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

      const yearProgressions: YearProgressModel[] = service.progressions(
        progressConfig,
        isMetric,
        activities as Activity[]
      );

      // Then
      /* Common checks */
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedYearsLength);

      const yearProgressModel = yearProgressions[0];
      const rollingWeekProgress = yearProgressModel.progressions;

      expect(yearProgressModel.mode).toEqual(ProgressMode.ROLLING);
      expect(yearProgressModel.year).toEqual(expectedYear);
      expect(rollingWeekProgress.length).toEqual(expectedDaysInYear);
      expect(rollingWeekProgress[0].year).toEqual(expectedYear);
      expect(rollingWeekProgress[0].dayOfYear).toEqual(1);

      /* Rolling distance (km) sum checks */
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

      /* Rolling time sum checks */
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

      /* Rolling elevation sum checks */
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

      /* Rolling count sum checks */
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

    it("should calculate 1 day rolling distance progression with multiple activities per day (no previous year)", done => {
      // Given
      const expectedYearsLength = 1;
      const expectedYear = 2019;
      const expectedDaysInYear = 365;
      const rollingDays = 1;
      const progressConfig = new RollingProgressConfigModel([ElevateSport.Ride], true, true, rollingDays);

      const todayTime = "2019-02-15 20:00";
      getTodayMomentSpy.and.returnValue(moment(todayTime, "YYYY-MM-DD hh:mm"));

      /* History definition */
      activities.push(createActivity("2019-02-01", ElevateSport.Ride, 10000, 3600, 100));

      activities.push(createActivity("2019-02-02", ElevateSport.Ride, 10000, 3600, 100)); // 1st activity on 2019-02-02 => 10km
      activities.push(createActivity("2019-02-02", ElevateSport.Ride, 15000, 3600, 100)); // 2nd activity on 2019-02-02 => 15km

      activities.push(createActivity("2019-02-03", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-04", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-05", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-06", ElevateSport.Ride, 10000, 3600, 100));
      activities.push(createActivity("2019-02-07", ElevateSport.Ride, 10000, 3600, 100));
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

      const yearProgressions: YearProgressModel[] = service.progressions(
        progressConfig,
        isMetric,
        activities as Activity[]
      );

      // Then
      /* Common checks */
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions).not.toBeNull();
      expect(yearProgressions.length).toEqual(expectedYearsLength);

      const yearProgressModel = yearProgressions[0];
      const rollingWeekProgress = yearProgressModel.progressions;

      expect(yearProgressModel.mode).toEqual(ProgressMode.ROLLING);
      expect(yearProgressModel.year).toEqual(expectedYear);
      expect(rollingWeekProgress.length).toEqual(expectedDaysInYear);
      expect(rollingWeekProgress[0].year).toEqual(expectedYear);
      expect(rollingWeekProgress[0].dayOfYear).toEqual(1);

      /* Rolling checks */
      const januaryDaysOffset = 31;
      expect(rollingWeekProgress[/* Feb 1, 2019 */ januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 2, 2019 */ 1 + januaryDaysOffset].distance).toEqual(25); // 25km expected on 2019-02-02
      expect(rollingWeekProgress[/* Feb 3, 2019 */ 2 + januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 4, 2019 */ 3 + januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 5, 2019 */ 4 + januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 6, 2019 */ 5 + januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 7, 2019 */ 6 + januaryDaysOffset].distance).toEqual(10);
      expect(rollingWeekProgress[/* Feb 8, 2019 */ 7 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 9, 2019 */ 8 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 10, 2019 */ 9 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 11, 2019 */ 10 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 12, 2019 */ 11 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 13, 2019 */ 12 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 14, 2019 */ 13 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 15, 2019 */ 14 + januaryDaysOffset].distance).toEqual(0);
      expect(rollingWeekProgress[/* Feb 16, 2019 */ 15 + januaryDaysOffset].distance).toEqual(0);

      done();
    });
  });

  describe("compute target progression", () => {
    describe("Year to date target progression", () => {
      it("should compute year to date target progression on non leap year", done => {
        // Given
        const year = 2018;
        const targetValue = 5000;
        const expectedTargetProgressionLength = 365;
        const expectedStep = 13.698;

        // When
        const targetProgressModels: TargetProgressModel[] = service.yearToDateTargetProgression(year, targetValue);

        // Then
        expect(targetProgressModels).not.toBeNull();
        expect(targetProgressModels.length).toEqual(expectedTargetProgressionLength);
        expect(_.floor(targetProgressModels[1].value - targetProgressModels[0].value, 3)).toEqual(expectedStep);

        done();
      });

      it("should compute year to date target progression on leap year", done => {
        // Given
        const year = 2016;
        const targetValue = 5000;
        const expectedTargetProgressionLength = 366;
        const expectedStep = 13.661;

        // When
        const targetProgressModels: TargetProgressModel[] = service.yearToDateTargetProgression(year, targetValue);

        // Then
        expect(targetProgressModels).not.toBeNull();
        expect(targetProgressModels.length).toEqual(expectedTargetProgressionLength);
        expect(_.floor(targetProgressModels[1].value - targetProgressModels[0].value, 3)).toEqual(expectedStep);

        done();
      });
    });

    describe("Rolling target progression", () => {
      it("should compute rolling distance target progression", done => {
        // Given
        const year = 2018;
        const targetValue = 140;
        const expectedTargetProgressionLength = 365;

        // When
        const targetProgressModels: TargetProgressModel[] = service.rollingTargetProgression(year, targetValue);

        // Then
        expect(targetProgressModels).not.toBeNull();
        expect(targetProgressModels.length).toEqual(expectedTargetProgressionLength);
        expect(Math.floor(_.first(targetProgressModels).value)).toEqual(targetValue);
        expect(Math.floor(_.last(targetProgressModels).value)).toEqual(targetValue);

        const targetEachDays = Math.floor(
          _.sumBy(targetProgressModels, (targetProgressModel: TargetProgressModel) => {
            return targetProgressModel.value;
          }) / expectedTargetProgressionLength
        );

        expect(targetEachDays).toEqual(targetValue);

        done();
      });
    });
  });

  describe("format human readable time", () => {
    it("should format 24 hours to human readable time", done => {
      // Given
      const hours = 24;
      const expected = "24h";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 24 hours to human readable time", done => {
      // Given
      const hours = 1;
      const expected = "1h";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 50 hours to human readable time", done => {
      // Given
      const hours = 50;
      const expected = "50h";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 76.25 hours to human readable time", done => {
      // Given
      const hours = 76.25;
      const expected = "76h, 15m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 29.5 hours to human readable time", done => {
      // Given
      const hours = 29.5;
      const expected = "29h, 30m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 15 hours to human readable time", done => {
      // Given
      const hours = 15;
      const expected = "15h";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 5.815 hours to human readable time", done => {
      // Given
      const hours = 5.815;
      const expected = "5h, 48m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 15.3333333 hours to human readable time", done => {
      // Given
      const hours = 15.3333333;
      const expected = "15h, 19m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 0.25 hours to human readable time", done => {
      // Given
      const hours = 0.25;
      const expected = "15m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format -12.5 negative hours to human readable time", done => {
      // Given
      const hours = -12.5;
      const expected = "12h, 30m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 0 hours to human readable time", done => {
      // Given
      const hours = 0;
      const expected = "0h";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });

    it("should format 25.55 hours to human readable time", done => {
      // Given
      const hours = 25.55;
      const expected = "25h, 33m";

      // When
      const result: string = service.readableTimeProgress(hours);

      // Then
      expect(result).toEqual(expected);
      done();
    });
  });

  describe("manage presets", () => {
    it("should list presets", done => {
      // Given
      const expected: YearToDateProgressPresetModel[] = [
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false)
      ];

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(Promise.resolve(expected));

      // When
      const promise: Promise<YearToDateProgressPresetModel[]> = service.fetchPresets();

      // Then
      promise.then(
        (list: YearToDateProgressPresetModel[]) => {
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(list).not.toBeNull();
          expect(list).toEqual(expected);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should add a year to date preset", done => {
      // Given
      const modelToBeAdded = new YearToDateProgressPresetModel(
        ProgressType.DISTANCE,
        [ElevateSport.Ride, ElevateSport.VirtualRide],
        true,
        true,
        5000
      );

      const progressPresetModels: YearToDateProgressPresetModel[] = [
        new YearToDateProgressPresetModel(
          ProgressType.DISTANCE,
          [ElevateSport.Ride, ElevateSport.VirtualRide],
          true,
          true
        ),
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], true, true, 5000),
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false)
      ];

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(
        Promise.resolve(progressPresetModels)
      );

      const insertDaoSpy = spyOn(service.yearProgressPresetDao, "insert").and.returnValue(
        Promise.resolve(modelToBeAdded)
      );

      // When
      const promise: Promise<YearToDateProgressPresetModel> = service.addPreset(modelToBeAdded);

      // Then
      promise.then(
        () => {
          expect(insertDaoSpy).toHaveBeenCalledTimes(1);
          expect(insertDaoSpy).toHaveBeenCalledWith(modelToBeAdded);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should add a rolling progress preset", done => {
      // Given
      const modelToBeAdded = new RollingProgressPresetModel(
        ProgressType.ELEVATION,
        [ElevateSport.Ride],
        true,
        true,
        5000,
        "Months",
        2
      );
      const progressPresetModels: YearToDateProgressPresetModel[] = [
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], true, true, 5000),
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false),
        new RollingProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], true, true, 5000, "Months", 1)
      ];

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(
        Promise.resolve(progressPresetModels)
      );

      const insertDaoSpy = spyOn(service.yearProgressPresetDao, "insert").and.callThrough();

      // When
      const promise: Promise<YearToDateProgressPresetModel> = service.addPreset(modelToBeAdded);

      // Then
      promise.then(
        (presetModel: YearToDateProgressPresetModel) => {
          expect(presetModel).not.toBeNull();
          expect(insertDaoSpy).toHaveBeenCalledTimes(1);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(presetModel).toEqual(modelToBeAdded);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should reject adding a year to date preset already existing (with target)", done => {
      // Given
      const modelToBeAdded = new YearToDateProgressPresetModel(
        ProgressType.ELEVATION,
        [ElevateSport.Ride],
        true,
        true,
        5000
      );
      const progressPresetModels: YearToDateProgressPresetModel[] = [
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        modelToBeAdded,
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false)
      ];

      const expectedErrorMessage = "You already saved this preset.";

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(
        Promise.resolve(progressPresetModels)
      );

      const insertDaoSpy = spyOn(service.yearProgressPresetDao, "insert").and.callThrough();

      // When
      const promise: Promise<YearToDateProgressPresetModel> = service.addPreset(modelToBeAdded);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(insertDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS);
          expect(error.message).toEqual(expectedErrorMessage);

          done();
        }
      );
    });

    it("should reject adding a year to date preset already existing (without target)", done => {
      // Given
      const modelToBeAdded = new YearToDateProgressPresetModel(
        ProgressType.DISTANCE,
        [ElevateSport.Ride, ElevateSport.VirtualRide],
        true,
        true
      );
      const progressPresetModels: YearToDateProgressPresetModel[] = [
        modelToBeAdded,
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], true, true, 5000),
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false)
      ];

      const expectedErrorMessage = "You already saved this preset.";

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(
        Promise.resolve(progressPresetModels)
      );

      const insertDaoSpy = spyOn(service.yearProgressPresetDao, "insert").and.callThrough();

      // When
      const promise: Promise<YearToDateProgressPresetModel> = service.addPreset(modelToBeAdded);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(insertDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS);
          expect(error.message).toEqual(expectedErrorMessage);

          done();
        }
      );
    });

    it("should reject adding a rolling preset already existing", done => {
      // Given
      const modelToBeAdded = new RollingProgressPresetModel(
        ProgressType.ELEVATION,
        [ElevateSport.Ride],
        true,
        true,
        5000,
        "Months",
        2
      );
      const progressPresetModels: YearToDateProgressPresetModel[] = [
        modelToBeAdded,
        new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false),
        new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], true, true, 5000),
        new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false),
        new YearToDateProgressPresetModel(
          ProgressType.DISTANCE,
          [ElevateSport.Ride, ElevateSport.VirtualRide],
          true,
          true
        )
      ];

      const expectedErrorMessage = "You already saved this preset.";

      const fetchDaoSpy = spyOn(service.yearProgressPresetDao, "find").and.returnValue(
        Promise.resolve(progressPresetModels)
      );

      const insertDaoSpy = spyOn(service.yearProgressPresetDao, "insert").and.callThrough();

      // When
      const promise: Promise<YearToDateProgressPresetModel> = service.addPreset(modelToBeAdded);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(insertDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS);
          expect(error.message).toEqual(expectedErrorMessage);

          done();
        }
      );
    });

    it("should delete preset", done => {
      // Given
      const model = new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false);

      const removeByIdDaoSpy = spyOn(service.yearProgressPresetDao, "removeById").and.returnValue(Promise.resolve());

      // When
      const promise: Promise<void> = service.deletePreset(model.id);

      // Then
      promise.then(
        () => {
          expect(removeByIdDaoSpy).toHaveBeenCalledWith(model.id);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });
  });
});
