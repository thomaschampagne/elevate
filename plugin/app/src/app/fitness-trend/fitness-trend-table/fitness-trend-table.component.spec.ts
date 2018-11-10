import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendTableComponent } from "./fitness-trend-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { userSettingsData } from "@elevate/shared/data";
import { TEST_SYNCED_ACTIVITIES } from "../../../shared-fixtures/activities-2015.fixture";
import { FitnessTrendModule } from "../fitness-trend.module";
import * as _ from "lodash";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";

describe("FitnessTrendTableComponent", () => {

	let activityService: ActivityService = null;
	let userSettingsService: UserSettingsService = null;

	let component: FitnessTrendTableComponent;
	let fixture: ComponentFixture<FitnessTrendTableComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			],
		}).compileComponents();

		activityService = TestBed.get(ActivityService);
		userSettingsService = TestBed.get(UserSettingsService);

		// Mocking
		spyOn(activityService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(TEST_SYNCED_ACTIVITIES)));
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(userSettingsData)));

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(FitnessTrendTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
