import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressComponent } from './year-progress.component';
import { SharedModule } from "../shared/shared.module";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { CoreModule } from "../core/core.module";
import { ActivatedRoute } from "@angular/router";
import { RequiredYearProgressDataModel } from "./models/required-year-progress-data.model";
import { Observable } from "rxjs/Observable";
import { YearProgressActivitiesFixture } from "./services/year-progress-activities.fixture";
import { YearProgressModel } from "./models/year-progress.model";
import { YearLineStyleModel } from "./models/year-line-style.model";
import { YearProgressStyleModel } from "./models/year-progress-style.model";

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
		const mostPerformedType = YearProgressComponent.findMostPerformedActivityType(activitiesCountByTypeModels);

		// Then
		expect(mostPerformedType).toEqual(expected);

	});

	it("should give proper color to year lines", () => {

		// Given
		const colorPalette: string [] = ["red", "blue", "green", "purple", "orange"];

		const yearProgressModels: YearProgressModel[] = [
			new YearProgressModel(2011, []),
			new YearProgressModel(2012, []),
			new YearProgressModel(2013, []),
			new YearProgressModel(2014, []),
			new YearProgressModel(2015, []),
			new YearProgressModel(2016, []),
			new YearProgressModel(2017, []),
		];

		const expectedYearLineStyleModels: YearLineStyleModel[] = [
			{stroke: "blue"},
			{stroke: "red"},
			{stroke: "orange"},
			{stroke: "purple"},
			{stroke: "green"},
			{stroke: "blue"},
			{stroke: "red"}
		];

		const expectedCircleColors = ["blue", "red", "orange", "purple", "green", "blue", "red"];

		// When
		const result: YearProgressStyleModel = component.getYearProgressStyleFromPalette(yearProgressModels, colorPalette);

		// Then
		expect(result.colorMap.get(2011)).toEqual("blue");
		expect(result.colorMap.get(2012)).toEqual("red");
		expect(result.colorMap.get(2013)).toEqual("orange");
		expect(result.colorMap.get(2014)).toEqual("purple");
		expect(result.colorMap.get(2015)).toEqual("green");
		expect(result.colorMap.get(2016)).toEqual("blue");
		expect(result.colorMap.get(2017)).toEqual("red");

		expect(result.lineStyles).toEqual(expectedYearLineStyleModels);
		expect(result.circleColors).toEqual(expectedCircleColors);

	});

});
