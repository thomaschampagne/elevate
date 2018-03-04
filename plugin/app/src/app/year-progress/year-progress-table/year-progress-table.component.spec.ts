import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressTableComponent } from "./year-progress-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressService } from "../shared/services/year-progress.service";
import { SyncedActivityModel } from "../../../../../common/scripts/models/Sync";
import * as moment from "moment";
import { ProgressType } from "../shared/models/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import { ProgressionAtDayModel } from "../shared/models/progression-at-date.model";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import { DeltaType } from "./models/delta-type.enum";

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

		// Inject today
		component.momentWatched = moment();

		// Inject fake progression
		const typesFilter: string[] = ["Ride", "VirtualRide", "Run"];
		const yearsFilter: number[] = []; // All
		const isMetric = true;
		const includeCommuteRide = true;
		component.yearProgressModels = yearProgressService.progression(syncedActivityModels,
			typesFilter,
			yearsFilter,
			isMetric,
			includeCommuteRide);

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
		expect(progressionRow2018.previousDate).toEqual("March 01, 2017");
		expect(progressionRow2018.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2018.progressTypeUnit).toEqual("km");
		expect(progressionRow2018.currentValue).toEqual(0);
		expect(progressionRow2018.delta).toEqual(1020);
		expect(progressionRow2018.deltaType).toEqual(DeltaType.NEGATIVE);
		expect(progressionRow2018.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(progressionRow2018.deltaClass).toEqual(DeltaType.NEGATIVE.toString());

		const progressionRow2017 = progressionRows[1];
		expect(progressionRow2017.year).toEqual(2017);
		expect(progressionRow2017.color).toEqual("green");
		expect(progressionRow2017.previousDate).toEqual("March 01, 2016");
		expect(progressionRow2017.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2017.progressTypeUnit).toEqual("km");
		expect(progressionRow2017.currentValue).toEqual(1020);
		expect(progressionRow2017.delta).toEqual(10);
		expect(progressionRow2017.deltaType).toEqual(DeltaType.NEGATIVE);
		expect(progressionRow2017.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(progressionRow2017.deltaClass).toEqual(DeltaType.NEGATIVE.toString());

		const progressionRow2016 = progressionRows[2];
		expect(progressionRow2016.year).toEqual(2016);
		expect(progressionRow2016.color).toEqual("blue");
		expect(progressionRow2016.previousDate).toEqual("March 01, 2015");
		expect(progressionRow2016.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2016.progressTypeUnit).toEqual("km");
		expect(progressionRow2016.currentValue).toEqual(1030);
		expect(progressionRow2016.delta).toEqual(10);
		expect(progressionRow2016.deltaType).toEqual(DeltaType.POSITIVE);
		expect(progressionRow2016.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(progressionRow2016.deltaClass).toEqual(DeltaType.POSITIVE.toString());

		const progressionRow2015 = progressionRows[3];
		expect(progressionRow2015.year).toEqual(2015);
		expect(progressionRow2015.color).toEqual("red");
		expect(progressionRow2015.previousDate).toEqual(null);
		expect(progressionRow2015.progressTypeLabel).toEqual("Distance");
		expect(progressionRow2015.progressTypeUnit).toEqual("km");
		expect(progressionRow2015.currentValue).toEqual(1020);
		expect(progressionRow2015.delta).toEqual(null);
		expect(progressionRow2015.deltaType).toEqual(DeltaType.NAN);
		expect(progressionRow2015.deltaSignSymbol).toEqual(null);
		expect(progressionRow2015.deltaClass).toEqual(DeltaType.NAN.toString());
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
		expect(firstRow.previousDate).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.delta).toEqual(Math.abs(hoursFirstYear - hoursSecondYear));
		expect(firstRow.deltaType).toEqual(DeltaType.NEGATIVE);
		expect(firstRow.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
		expect(firstRow.deltaClass).toEqual(DeltaType.NEGATIVE.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.previousDate).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.delta).toEqual(null);
		expect(secondRow.deltaType).toEqual(DeltaType.NAN);
		expect(secondRow.deltaSignSymbol).toEqual(null);
		expect(secondRow.deltaClass).toEqual(DeltaType.NAN.toString());
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
		expect(firstRow.previousDate).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.delta).toEqual(0);
		expect(firstRow.deltaType).toEqual(DeltaType.UNSIGNED);
		expect(firstRow.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
		expect(firstRow.deltaClass).toEqual(DeltaType.UNSIGNED.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.previousDate).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.delta).toEqual(null);
		expect(secondRow.deltaType).toEqual(DeltaType.NAN);
		expect(secondRow.deltaSignSymbol).toEqual(null);
		expect(secondRow.deltaClass).toEqual(DeltaType.NAN.toString());
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
		expect(firstRow.previousDate).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Time");
		expect(firstRow.progressTypeUnit).toEqual("h");
		expect(firstRow.currentValue).toEqual(hoursFirstYear);
		expect(firstRow.delta).toEqual(24);
		expect(firstRow.deltaType).toEqual(DeltaType.POSITIVE);
		expect(firstRow.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
		expect(firstRow.deltaClass).toEqual(DeltaType.POSITIVE.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.previousDate).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Time");
		expect(secondRow.progressTypeUnit).toEqual("h");
		expect(secondRow.currentValue).toEqual(hoursSecondYear);
		expect(secondRow.delta).toEqual(null);
		expect(secondRow.deltaType).toEqual(DeltaType.NAN);
		expect(secondRow.deltaSignSymbol).toEqual(null);
		expect(secondRow.deltaClass).toEqual(DeltaType.NAN.toString());
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
		expect(firstRow.previousDate).toEqual("August 15, 2016");
		expect(firstRow.progressTypeLabel).toEqual("Elevation");
		expect(firstRow.progressTypeUnit).toEqual("ft");
		expect(firstRow.currentValue).toEqual(25000);
		expect(firstRow.delta).toEqual(0);
		expect(firstRow.deltaType).toEqual(DeltaType.UNSIGNED);
		expect(firstRow.deltaSignSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
		expect(firstRow.deltaClass).toEqual(DeltaType.UNSIGNED.toString());

		const secondRow = progressionRows[1];
		expect(secondRow.year).toEqual(2016);
		expect(secondRow.previousDate).toEqual(null);
		expect(secondRow.progressTypeLabel).toEqual("Elevation");
		expect(secondRow.progressTypeUnit).toEqual("ft");
		expect(secondRow.currentValue).toEqual(25000);
		expect(secondRow.delta).toEqual(null);
		expect(secondRow.deltaType).toEqual(DeltaType.NAN);
		expect(secondRow.deltaSignSymbol).toEqual(null);
		expect(secondRow.deltaClass).toEqual(DeltaType.NAN.toString());
		done();
	});

});
