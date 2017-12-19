import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendComponent } from './fitness-trend.component';
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { SideNavService } from "../shared/services/side-nav/side-nav.service";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";

describe('FitnessTrendComponent', () => {

	let activityDao: ActivityDao = null;
	let userSettingsDao: UserSettingsDao = null;
	let component: FitnessTrendComponent;
	let fixture: ComponentFixture<FitnessTrendComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [SideNavService]
		}).compileComponents();

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);

		// Mocking chrome storage
		spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		spyOn(userSettingsDao, "chromeStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettings);
			},
			set: (keys: any, callback: () => {}) => {
				callback();
			}
		});

	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
