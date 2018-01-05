import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressGraphComponent } from './year-progress-graph.component';
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import * as moment from "moment";
import { YearProgressService } from "../shared/services/year-progress.service";
import { SyncedActivityModel } from "../../../../../common/scripts/models/Sync";
import { ProgressType } from "../shared/models/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressModel } from "../shared/models/year-progress.model";
import { YearProgressStyleModel } from "./models/year-progress-style.model";

describe('YearProgressGraphComponent', () => {

	let component: YearProgressGraphComponent;
	let fixture: ComponentFixture<YearProgressGraphComponent>;
	let yearProgressService: YearProgressService;
	let syncedActivityModels: SyncedActivityModel[];

	beforeEach(async(() => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [YearProgressService]
		}).compileComponents();

		yearProgressService = TestBed.get(YearProgressService);

	}));

	beforeEach(() => {

		syncedActivityModels = YearProgressActivitiesFixture.provide();

		fixture = TestBed.createComponent(YearProgressGraphComponent);
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
		component.selectedProgressType = new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", "km");

		fixture.detectChanges();

	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it("should give proper colors to all year lines from a color palette", () => {

		// Given
		const colorPalette: string [] = ["red", "blue", "green", "purple", "orange"];
		const expectedGlobalColors: string [] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

		const yearProgressModels: YearProgressModel[] = [
			new YearProgressModel(2011, []),
			new YearProgressModel(2012, []),
			new YearProgressModel(2013, []),
			new YearProgressModel(2014, []),
			new YearProgressModel(2015, []),
			new YearProgressModel(2016, []),
			new YearProgressModel(2017, []),
		];

		// When
		const style: YearProgressStyleModel = component.styleFromPalette(yearProgressModels, colorPalette);

		// Then
		expect(style.colors).toEqual(expectedGlobalColors);

		expect(style.yearsColorsMap.get(2011)).toEqual("red");
		expect(style.yearsColorsMap.get(2012)).toEqual("blue");
		expect(style.yearsColorsMap.get(2013)).toEqual("green");
		expect(style.yearsColorsMap.get(2014)).toEqual("purple");
		expect(style.yearsColorsMap.get(2015)).toEqual("orange");
		expect(style.yearsColorsMap.get(2016)).toEqual("red");
		expect(style.yearsColorsMap.get(2017)).toEqual("blue");

	});

	it("should give proper restricted colors from a year selection", () => {

		// Given
		const colors: string [] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

		const yearsColorsMap = new Map<number, string>();
		yearsColorsMap.set(2011, "red");
		yearsColorsMap.set(2012, "blue");
		yearsColorsMap.set(2013, "green");
		yearsColorsMap.set(2014, "purple");
		yearsColorsMap.set(2015, "orange");
		yearsColorsMap.set(2016, "red");
		yearsColorsMap.set(2017, "blue");

		const yearSelection: number[] = [2017, 2016, 2013];

		const expectedYearSelectedColors: string[] = [
			yearsColorsMap.get(2013),
			yearsColorsMap.get(2016),
			yearsColorsMap.get(2017)
		];

		component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

		// When
		const yearSelectedColors: string [] = component.colorsOfSelectedYears(yearSelection);

		// Then
		expect(yearSelectedColors).toEqual(expectedYearSelectedColors);

	});

});
