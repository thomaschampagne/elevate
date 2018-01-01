import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressComponent } from './year-progress.component';
import { SharedModule } from "../shared/shared.module";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { CoreModule } from "../core/core.module";
import { ActivatedRoute } from "@angular/router";
import { RequiredYearProgressDataModel } from "./models/required-year-progress-data.model";
import { Observable } from "rxjs/Observable";
import { YearProgressActivitiesFixture } from "./services/year-progress-activities.fixture";

describe('YearProgressComponent', () => {

	let component: YearProgressComponent;
	let fixture: ComponentFixture<YearProgressComponent>;
	let requiredYearProgressDataModel: RequiredYearProgressDataModel;

	beforeEach(async(() => {

		requiredYearProgressDataModel = new RequiredYearProgressDataModel(true, YearProgressActivitiesFixture.provide());

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						data: Observable.of({requiredYearProgressDataModel: requiredYearProgressDataModel})
					}
				}
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it("should determine most performed activity type", () => {

		// Given
		const expected = "Ride";
		const activitiesCountByTypeModels: ActivityCountByTypeModel[] = [
			{type: "AlpineSki", count: 12},
			{type: "Ride", count: 522},
			{type: "Run", count: 25},
			{type: "Walk", count: 32},
			{type: "Hike", count: 8},
			{type: "Swim", count: 5},
			{type: "VirtualRide", count: 29},
			{type: "InlineSkate", count: 3},
			{type: "Workout", count: 6}
		];

		// When
		const mostPerformedType = component.findMostPerformedActivityType(activitiesCountByTypeModels);

		// Then
		expect(mostPerformedType).toEqual(expected);

	});

	it("should give proper colors to all year lines from a color palette", () => {

		// TODO Move that test in YearProgressGraphComponent Specs
		expect(false).toEqual(true);

		/*		// Given
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
                expect(style.yearsColorsMap.get(2017)).toEqual("blue");*/

	});

	it("should give proper restricted colors from a year selection", () => {

		// TODO Move that test in YearProgressGraphComponent Specs
		expect(false).toEqual(true);
		/*	// Given
            const colors: string [] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

            const yearsColorsMap = new Map<number, string>();
            yearsColorsMap.set(2011, "red");
            yearsColorsMap.set(2012, "blue");
            yearsColorsMap.set(2013, "green");
            yearsColorsMap.set(2014, "purple");
            yearsColorsMap.set(2015, "orange");
            yearsColorsMap.set(2016, "red");
            yearsColorsMap.set(2017, "blue");

            const yearSelection: number[] = [2013, 2016, 2017];

            const expectedYearSelectedColors: string[] = [
                yearsColorsMap.get(2013),
                yearsColorsMap.get(2016),
                yearsColorsMap.get(2017)
            ];

            component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

            // When
            const yearSelectedColors: string [] = component.colorsOfSelectedYears(yearSelection);

            // Then
            expect(yearSelectedColors).toEqual(expectedYearSelectedColors);*/

	});

});
