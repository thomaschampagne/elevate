import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressGraphComponent } from "./year-progress-graph.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import * as moment from "moment";
import { YearProgressService } from "../shared/services/year-progress.service";
import { SyncedActivityModel } from "../../../../../common/scripts/models/Sync";
import { ProgressType } from "../shared/models/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressStyleModel } from "./models/year-progress-style.model";

describe("YearProgressGraphComponent", () => {

	let component: YearProgressGraphComponent;
	let fixture: ComponentFixture<YearProgressGraphComponent>;
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

		fixture = TestBed.createComponent(YearProgressGraphComponent);
		component = fixture.componentInstance;

		// Inject today
		yearProgressService.momentWatched = moment();

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

		// Inject style
		const colors: string [] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

		const yearsColorsMap = new Map<number, string>();
		yearsColorsMap.set(2011, "red");
		yearsColorsMap.set(2012, "blue");
		yearsColorsMap.set(2013, "green");
		yearsColorsMap.set(2014, "purple");
		yearsColorsMap.set(2015, "orange");
		yearsColorsMap.set(2016, "red");
		yearsColorsMap.set(2017, "blue");

		component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

		fixture.detectChanges();

	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should give proper restricted colors from a year selection", (done: Function) => {

		// Given
		const yearSelection: number[] = [2017, 2016, 2013];

		const expectedYearSelectedColors: string[] = [
			component.yearProgressStyleModel.yearsColorsMap.get(2013),
			component.yearProgressStyleModel.yearsColorsMap.get(2016),
			component.yearProgressStyleModel.yearsColorsMap.get(2017)
		];

		// When
		const yearSelectedColors: string [] = component.colorsOfSelectedYears(yearSelection);

		// Then
		expect(yearSelectedColors).toEqual(expectedYearSelectedColors);
		done();
	});

});
