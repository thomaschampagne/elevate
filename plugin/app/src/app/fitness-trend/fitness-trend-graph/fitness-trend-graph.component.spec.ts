import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendGraphComponent } from "./fitness-trend-graph.component";
import { FitnessService } from "../shared/services/fitness.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { ActivityDao } from "../../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../shared-fixtures/activities-2015.fixture";
import * as moment from "moment";
import { Moment } from "moment";
import { UserSettingsDao } from "../../shared/dao/user-settings/user-settings.dao";
import { userSettings } from "../../../../../shared/UserSettings";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import * as _ from "lodash";
import { PeriodModel } from "../shared/models/period.model";
import { FitnessTrendModule } from "../fitness-trend.module";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";
import { Gender } from "../../shared/enums/gender.enum";
import { FitnessUserSettingsModel } from "../shared/models/fitness-user-settings.model";

describe("FitnessTrendGraphComponent", () => {

	let activityDao: ActivityDao;
	let userSettingsDao: UserSettingsDao;
	let activityService: ActivityService;
	let fitnessService: FitnessService;
	let component: FitnessTrendGraphComponent;
	let fixture: ComponentFixture<FitnessTrendGraphComponent>;
	let todayMoment: Moment;
	let updateGraphSpy: jasmine.Spy;

	const todayDate = "2015-12-01 12:00";
	const momentDatePattern = "YYYY-MM-DD hh:mm";

	let FITNESS_TREND: DayFitnessTrendModel[] = null;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			],
		}).compileComponents();

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);
		activityService = TestBed.get(ActivityService);
		fitnessService = TestBed.get(FitnessService);

		// Mocking chrome storage
		spyOn(activityDao, "browserStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncedActivities: _.cloneDeep(TEST_SYNCED_ACTIVITIES)});
			}
		});

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettings);
			},
			set: (keys: any, callback: () => {}) => {
				callback();
			}
		});

		todayMoment = moment("2015-12-01 12:00", "YYYY-MM-DD hh:mm");
		spyOn(fitnessService, "getTodayMoment").and.returnValue(todayMoment);

		const heartRateImpulseMode = HeartRateImpulseMode.HRSS;
		const powerMeterEnable = true;
		const swimEnable = true;

		const fitnessUserSettingsModel: FitnessUserSettingsModel = {
			userGender: Gender.MEN,
			userMaxHr: 190,
			userRestHr: 60,
			userLactateThreshold: {
				default: 163,
				cycling: null,
				running: null
			},
			cyclingFtp: 150,
			swimFtp: 31,
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel, heartRateImpulseMode, powerMeterEnable, swimEnable);
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {
			FITNESS_TREND = fitnessTrend;
			done();
		});

	});

	beforeEach((done: Function) => {

		fixture = TestBed.createComponent(FitnessTrendGraphComponent);

		component = fixture.componentInstance;
		component.isTrainingZonesEnabled = true;

		component.fitnessTrend = FITNESS_TREND;
		component.dateMin = moment(_.first(FITNESS_TREND).date).startOf("day").toDate();
		component.dateMax = moment(_.last(FITNESS_TREND).date).startOf("day").toDate();

		component.periodViewed = {
			from: component.dateMin,
			to: component.dateMax
		};

		spyOn(component, "getTodayViewedDay").and.returnValue(component.getDayFitnessTrendFromDate(todayMoment.toDate()));
		updateGraphSpy = spyOn(component, "updateGraph").and.stub(); // Do not try to draw the graph

		fixture.detectChanges();

		done();

	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should allow forward period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-01-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-01-06";
		const periodTo = "2015-01-16";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment("2015-01-20", "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment("2015-01-30", "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedForward();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(2);
		done();
	});

	it("should NOT forward period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-01-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-01-10";
		const periodTo = "2015-01-20";
		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};

		const expectedPeriodFrom = moment(periodFrom, "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment(periodTo, "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedForward();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(1);
		done();

	});

	it("should allow backward period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-01-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-01-20";
		const periodTo = "2015-01-30";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment("2015-01-6", "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment("2015-01-16", "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedBackward();

		// Then
		expect(component.periodViewed.from.toDateString()).toBe(expectedPeriodFrom.toDateString());
		expect(component.periodViewed.to.toDateString()).toBe(expectedPeriodTo.toDateString());
		expect(updateGraphSpy).toHaveBeenCalledTimes(2);
		done();
	});

	it("should NOT backward period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-01-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-01-10";
		const periodTo = "2015-01-20";
		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};

		const expectedPeriodFrom = moment(periodFrom, "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment(periodTo, "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedBackward();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(1);
		done();
	});

	it("should allow zoom in period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-12-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-06-01";
		const periodTo = "2015-12-31";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment("2015-06-15", "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment("2015-12-31", "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedZoomIn();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(2);
		done();
	});

	it("should NOT allow zoom in period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-12-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-06-20";
		const periodTo = "2015-06-30";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment(periodFrom, "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment(periodTo, "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedZoomIn();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(1);
		done();
	});

	it("should allow zoom out period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-12-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-05-15";
		const periodTo = "2015-12-31";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment("2015-05-01", "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment("2015-12-31", "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedZoomOut();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(2);
		done();
	});

	it("should NOT allow zoom out period viewed", (done: Function) => {

		// Given
		component.dateMin = moment("2015-01-01", "YYYY-MM-DD").toDate();
		component.dateMax = moment("2015-12-31", "YYYY-MM-DD").toDate();

		const periodFrom = "2015-01-10";
		const periodTo = "2015-10-31";

		component.periodViewed = {
			from: moment(periodFrom, "YYYY-MM-DD").toDate(),
			to: moment(periodTo, "YYYY-MM-DD").toDate()
		};
		const expectedPeriodFrom = moment(periodFrom, "YYYY-MM-DD").toDate();
		const expectedPeriodTo = moment(periodTo, "YYYY-MM-DD").toDate();

		// When
		component.onPeriodViewedZoomOut();

		// Then
		expect(component.periodViewed.from.getTime()).toBe(expectedPeriodFrom.getTime());
		expect(component.periodViewed.to.getTime()).toBe(expectedPeriodTo.getTime());
		expect(updateGraphSpy).toHaveBeenCalledTimes(1);
		done();
	});

	it("should convert -7 days date based period 'from/to' to 'start/end' fitness trends indexes", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment(todayDate, momentDatePattern).subtract(7, "days").toDate(), // Nov 24 2015
			to: null // Indicate we use "Last period of TIME"
		};

		// When
		const indexes: { start: number; end: number } = component.indexesOf(period);

		// Then
		expect(indexes).not.toBeNull();
		expect(indexes.start).toEqual(324); // Should be Nov 24 2015
		expect(indexes.end).toEqual(345); // Last preview day index
		done();

	});

	it("should convert -6 weeks date based period 'from/to' to 'start/end' fitness trends indexes", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment(todayDate, momentDatePattern).subtract(6, "weeks").toDate(), // (= Oct 20 2015)
			to: null // Indicate we use "Last period of TIME"
		};

		// When
		const indexes: { start: number; end: number } = component.indexesOf(period);

		// Then
		expect(indexes.start).toEqual(289); // Should be Oct 20 2015 index
		expect(indexes.end).toEqual(345); // Last preview day index
		done();

	});

	it("should convert date based period 'from/to' to 'start/end' fitness trends indexes", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment("2015-07-01", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(),
			to: moment("2015-09-30", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(),
		};

		// When
		const indexes: { start: number; end: number } = component.indexesOf(period);

		// Then
		expect(indexes).not.toBeNull();
		expect(indexes.start).toEqual(178);
		expect(indexes.end).toEqual(269);
		done();

	});

	it("should failed when find indexes of 'from > to' date", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment("2015-06-01", DayFitnessTrendModel.DATE_FORMAT).toDate(),
			to: moment("2015-05-01", DayFitnessTrendModel.DATE_FORMAT).toDate()
		};

		// When
		let error = null;
		try {
			component.indexesOf(period);
		} catch (e) {
			error = e;
		}

		// Then
		expect(error).not.toBeNull();
		expect(error).toBe("FROM cannot be upper than TO date");
		done();

	});

	it("should provide 'start' index of the first known activity when FROM don't matches athlete activities", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment("2014-06-01", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(), // Too old date !
			to: moment("2015-09-30", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(),
		};

		// When
		const indexes: { start: number; end: number } = component.indexesOf(period);

		// Then
		expect(indexes).not.toBeNull();
		expect(indexes.start).toEqual(0);
		expect(indexes.end).toEqual(269);

		done();

	});

	it("should failed when find index of TO which do not exists ", (done: Function) => {

		// Given
		const period: PeriodModel = {
			from: moment("2015-06-01", DayFitnessTrendModel.DATE_FORMAT).toDate(),
			to: moment("2018-05-01", DayFitnessTrendModel.DATE_FORMAT).toDate() // Fake
		};

		// When
		let error = null;
		try {
			component.indexesOf(period);
		} catch (e) {
			error = e;
		}

		// Then
		expect(error).not.toBeNull();
		expect(error).toBe("No end activity index found for this TO date");
		done();
	});

});
