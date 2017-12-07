import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendGraphComponent } from "./fitness-trend-graph.component";
import { FitnessService } from "../shared/service/fitness.service";
import { MaterialModule } from "../../shared/modules/material.module";
import { FormsModule } from "@angular/forms";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { ActivityDao } from "../../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../fixtures/activities";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import * as moment from "moment";
import { Moment } from "moment";
import { MatNativeDateModule } from "@angular/material";

describe("FitnessTrendGraphComponent", () => {

	let activityDao: ActivityDao = null;
	let activityService: ActivityService = null;
	let fitnessService: FitnessService = null;
	let component: FitnessTrendGraphComponent = null;
	let fixture: ComponentFixture<FitnessTrendGraphComponent> = null;
	let todayMoment: Moment = null;

	beforeEach(async(() => {

		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule, BrowserAnimationsModule, MatNativeDateModule],
			declarations: [FitnessTrendGraphComponent],
			providers: [FitnessService, ActivityService, ActivityDao]
		}).compileComponents();

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		activityService = TestBed.get(ActivityService);
		fitnessService = TestBed.get(FitnessService);

		// Mocking chrome local storage
		spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		todayMoment = moment("2015-12-01 12:00", "YYYY-MM-DD hh:mm");
		spyOn(fitnessService, "getTodayMoment").and.returnValue(todayMoment);

		spyOn(fitnessService, "indexesOf").and.returnValue({start: 289, end: 345});
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendGraphComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

});
