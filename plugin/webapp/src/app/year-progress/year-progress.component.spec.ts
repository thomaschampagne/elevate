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
		const mostPerformedType = YearProgressComponent.findMostPerformedActivityType(activitiesCountByTypeModels);

		// Then
		expect(mostPerformedType).toEqual(expected);

	});


});
