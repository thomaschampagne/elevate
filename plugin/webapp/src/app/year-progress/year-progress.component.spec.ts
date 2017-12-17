import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressComponent } from './year-progress.component';
import { SharedModule } from "../shared/shared.module";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { CoreModule } from "../core/core.module";

describe('YearProgressComponent', () => {

	let activityDao: ActivityDao = null;
	let component: YearProgressComponent;
	let fixture: ComponentFixture<YearProgressComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();


		activityDao = TestBed.get(ActivityDao);

		spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

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


});
