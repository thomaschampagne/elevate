import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressTableComponent } from "./year-progress-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressService } from "../shared/services/year-progress.service";
import * as moment from "moment";
import { ProgressType } from "../shared/models/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import { ProgressionAtDayModel } from "../shared/models/progression-at-date.model";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import { DeltaType } from "./models/delta-type.enum";
import { SyncedActivityModel } from "../../../../../shared/models/sync/synced-activity.model";
import { YearProgressModule } from "../year-progress.module";

describe("YearProgressTableComponent", () => {

	let component: YearProgressTableComponent;
	let fixture: ComponentFixture<YearProgressTableComponent>;
	let yearProgressService: YearProgressService;
	let syncedActivityModels: SyncedActivityModel[];

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				YearProgressModule
			],
			providers: [YearProgressService]
		}).compileComponents();

		yearProgressService = TestBed.get(YearProgressService);

		done();
	});

	beforeEach(() => {

		syncedActivityModels = YearProgressActivitiesFixture.provide();

		fixture = TestBed.createComponent(YearProgressTableComponent);
		component = fixture.componentInstance;

		component.currentYear = 2018;
		component.momentWatched = moment().year(component.currentYear);

		// Inject fake progression
		const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
		const yearsFilter: number[] = []; // All
		const isMetric = true;
		const includeCommuteRide = true;
		const includeIndoorRide = true;
		component.yearProgressModels = yearProgressService.progression(syncedActivityModels,
			typesFilter,
			yearsFilter,
			isMetric,
			includeCommuteRide,
			includeIndoorRide);

		// Inject selected years (here all from syncedActivityModels)
		component.selectedYears = yearProgressService.availableYears(syncedActivityModels);

		// Inject progress type
		component.selectedProgressType = new YearProgressTypeModel(ProgressType.DISTANCE, "Distance",
			(isMetric) ? "kilometers" : "miles",
			(isMetric) ? "km" : "mi");

		// Inject style
		const colors: string [] = ["red", "blue", "green", "purple"];

		const yearsColorsMap = new Map<number, string>();
		yearsColorsMap.set(2015, "red");
		yearsColorsMap.set(2016, "blue");
		yearsColorsMap.set(2017, "green");
		yearsColorsMap.set(2018, "purple");

		component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should provide year progressions distance rows for data table display", (done: Function) => {

		// Given
		const dayMoment = moment("2018-03-01 12:00", "YYYY-MM-DD hh:mm");

		const progressionAtDayModels: ProgressionAtDayModel[] = yearProgressService.findProgressionsAtDay(component.yearProgressModels,
			dayMoment, component.selectedProgressType.type, component.selectedYears, component.yearProgressStyleModel.yearsColorsMap);

		// When
		const progressionRows: ProgressionAtDayRow[] = component.rows(progressionAtDayModels);

		// Then
		expect(progressionRows).not.toBeNull();

		const progressionRow2018 = progressionRows[0];
		expect(progressionRow2018.year).toEqual(2018);
		expect(progressionRow2018.color).toEqual("purple");
		expect(progressionRow2018.deltaPreviousYear.date).toEqual("March 01, 2017");
		expect(progressionRow2018.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2018.progressTypeUnit).toEqual("km");
		expect(progressionRow2018.currentValue).toEqual(0);
		expect(progressionRow2018.deltaPreviousYear.value).toEqual(1020);
		expect(progressionRow2018.deltaPreviousYear.type).toEqual(DeltaType.NEGATIVE);
		expect(progressionRow2018.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(progressionRow2018.deltaPreviousYear.class).toEqual(DeltaType.NEGATIVE.toString());
		expect(progressionRow2018.deltaCurrentYear.value).toEqual(0);
		expect(progressionRow2018.deltaCurrentYear.type).toEqual(DeltaType.NAN);
		expect(progressionRow2018.deltaCurrentYear.signSymbol).toEqual(null);
		expect(progressionRow2018.deltaCurrentYear.class).toEqual(DeltaType.NAN.toString());

		const progressionRow2017 = progressionRows[1];
		expect(progressionRow2017.year).toEqual(2017);
		expect(progressionRow2017.color).toEqual("green");
		expect(progressionRow2017.deltaPreviousYear.date).toEqual("March 01, 2016");
		expect(progressionRow2017.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2017.progressTypeUnit).toEqual("km");
		expect(progressionRow2017.currentValue).toEqual(1020);
		expect(progressionRow2017.deltaPreviousYear.value).toEqual(10);
		expect(progressionRow2017.deltaPreviousYear.type).toEqual(DeltaType.NEGATIVE);
		expect(progressionRow2017.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(progressionRow2017.deltaPreviousYear.class).toEqual(DeltaType.NEGATIVE.toString());
		expect(progressionRow2017.deltaCurrentYear.value).toEqual(1020);
		expect(progressionRow2017.deltaCurrentYear.type).toEqual(DeltaType.POSITIVE);
		expect(progressionRow2017.deltaCurrentYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(progressionRow2017.deltaCurrentYear.class).toEqual(DeltaType.POSITIVE.toString());

		const progressionRow2016 = progressionRows[2];
		expect(progressionRow2016.year).toEqual(2016);
		expect(progressionRow2016.color).toEqual("blue");
		expect(progressionRow2016.deltaPreviousYear.date).toEqual("March 01, 2015");
		expect(progressionRow2016.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2016.progressTypeUnit).toEqual("km");
		expect(progressionRow2016.currentValue).toEqual(1030);
		expect(progressionRow2016.deltaPreviousYear.value).toEqual(10);
		expect(progressionRow2016.deltaPreviousYear.type).toEqual(DeltaType.POSITIVE);
		expect(progressionRow2016.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(progressionRow2016.deltaPreviousYear.class).toEqual(DeltaType.POSITIVE.toString());
		expect(progressionRow2016.deltaCurrentYear.value).toEqual(1030);
		expect(progressionRow2016.deltaCurrentYear.type).toEqual(DeltaType.POSITIVE);
		expect(progressionRow2016.deltaCurrentYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(progressionRow2016.deltaCurrentYear.class).toEqual(DeltaType.POSITIVE.toString());

		const progressionRow2015 = progressionRows[3];
		expect(progressionRow2015.year).toEqual(2015);
		expect(progressionRow2015.color).toEqual("red");
		expect(progressionRow2015.deltaPreviousYear.date).toEqual(null);
		expect(progressionRow2015.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2015.progressTypeUnit).toEqual("km");
		expect(progressionRow2015.currentValue).toEqual(1020);
		expect(progressionRow2015.deltaPreviousYear.value).toEqual(null);
		expect(progressionRow2015.deltaPreviousYear.type).toEqual(DeltaType.NAN);
		expect(progressionRow2015.deltaPreviousYear.signSymbol).toEqual(null);
		expect(progressionRow2015.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
		expect(progressionRow2015.deltaCurrentYear.value).toEqual(1020);
		expect(progressionRow2015.deltaCurrentYear.type).toEqual(DeltaType.POSITIVE);
		expect(progressionRow2015.deltaCurrentYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(progressionRow2015.deltaCurrentYear.class).toEqual(DeltaType.POSITIVE.toString());

		done();
	});

	it("should provide proper year progressions time rows between two years (1)", (done: Function) => {

		// Given
		const hoursFirstYear = 24;
		const firstYear: ProgressionAtDayModel = {
			date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2017,
			progressType: ProgressType.TIME,
			value: hoursFirstYear,
			color: null
		};

		const hoursSecondYear = 36;
		const secondYear: ProgressionAtDayModel = {
			date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2016,
			progressType: ProgressType.TIME,
			value: hoursSecondYear,
			color: null
		};

		component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

		// When
		const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear]);

		// Then
		expect(progressionRows).not.toBeNull();

		const firstRow = progressionRows[0];
		expect(firstRow.year).toEqual(2017);
		expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.deltaPreviousYear.value).toEqual(Math.abs(hoursFirstYear - hoursSecondYear));
		expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.NEGATIVE);
		expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.NEGATIVE.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.deltaPreviousYear.date).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.deltaPreviousYear.value).toEqual(null);
		expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
		expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
		expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
		done();
	});

	it("should provide proper year progressions time rows when no delta between two years (2)", (done: Function) => {
		// Given
		const hoursFirstYear = 24;
		const firstYear: ProgressionAtDayModel = {
			date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2017,
			progressType: ProgressType.TIME,
			value: hoursFirstYear,
			color: null
		};

		const hoursSecondYear = 24;
		const secondYear: ProgressionAtDayModel = {
			date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2016,
			progressType: ProgressType.TIME,
			value: hoursSecondYear,
			color: null
		};

		component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

		// When
		const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear]);

		// Then
		expect(progressionRows).not.toBeNull();

		const firstRow = progressionRows[0];
		expect(firstRow.year).toEqual(2017);
		expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.deltaPreviousYear.value).toEqual(0);
		expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.UNSIGNED);
		expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
		expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.UNSIGNED.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.deltaPreviousYear.date).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.deltaPreviousYear.value).toEqual(null);
		expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
		expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
		expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
		done();
	});

	it("should provide proper year progressions time rows when no delta between two years (3)", (done: Function) => {
		// Given
		const hoursFirstYear = 24;
		const firstYear: ProgressionAtDayModel = {
			date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2017,
			progressType: ProgressType.TIME,
			value: hoursFirstYear,
			color: null
		};

		const hoursSecondYear = 0;
		const secondYear: ProgressionAtDayModel = {
			date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2016,
			progressType: ProgressType.TIME,
			value: hoursSecondYear,
			color: null
		};

		component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

		// When
		const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear]);

		// Then
		expect(progressionRows).not.toBeNull();

		const firstRow = progressionRows[0];
		expect(firstRow.year).toEqual(2017);
		expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.deltaPreviousYear.value).toEqual(24);
		expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.POSITIVE);
		expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.POSITIVE.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.deltaPreviousYear.date).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.deltaPreviousYear.value).toEqual(null);
		expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
		expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
		expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
		done();
	});

	it("should provide proper year progressions elevation rows when no delta between two years", (done: Function) => {

		// Given
		const firstYear: ProgressionAtDayModel = {
			date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2017,
			progressType: ProgressType.ELEVATION,
			value: 25000,
			color: null
		};

		const secondYear: ProgressionAtDayModel = {
			date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
			year: 2016,
			progressType: ProgressType.ELEVATION,
			value: 25000,
			color: null
		};

		component.selectedProgressType = new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", "feet", "ft");


		// When
		const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear]);

		// Then
		expect(progressionRows).not.toBeNull();

		const firstRow = progressionRows[0];
		expect(firstRow.year).toEqual(2017);
		expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Elevation");
		expect(firstRow.progressTypeUnit).toEqual("ft");
		expect(firstRow.currentValue).toEqual(25000);
		expect(firstRow.deltaPreviousYear.value).toEqual(0);
		expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.UNSIGNED);
		expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
		expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.UNSIGNED.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.deltaPreviousYear.date).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Elevation");
		expect(secondRow.progressTypeUnit).toEqual("ft");
		expect(secondRow.currentValue).toEqual(25000);
		expect(secondRow.deltaPreviousYear.value).toEqual(null);
		expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
		expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
		expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
		done();
	});

});
