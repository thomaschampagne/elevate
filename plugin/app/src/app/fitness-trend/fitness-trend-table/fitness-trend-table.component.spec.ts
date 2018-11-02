import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendTableComponent } from "./fitness-trend-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { userSettingsData } from "@elevate/shared/data";
import { ActivityDao } from "../../shared/dao/activity/activity.dao";
import { UserSettingsDao } from "../../shared/dao/user-settings/user-settings.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../shared-fixtures/activities-2015.fixture";
import { FitnessTrendModule } from "../fitness-trend.module";

describe("FitnessTrendTableComponent", () => {

	let activityDao: ActivityDao = null;
	let userSettingsDao: UserSettingsDao = null;

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

		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);

		// Mocking chrome storage
		spyOn(activityDao, "browserStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettingsData);
			},
			set: (keys: any, callback: () => {}) => {
				callback();
			}
		});

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
