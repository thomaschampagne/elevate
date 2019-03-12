import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivitiesComponent } from "./activities.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { ActivityService } from "../shared/services/activity/activity.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import * as _ from "lodash";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";
import { SyncService } from "../shared/services/sync/sync.service";
import { ChromeEventsService } from "../shared/services/external-updates/impl/chrome-events.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("ActivitiesComponent", () => {

	const pluginId = "c061d18abea0";
	let activityService: ActivityService = null;
	let userSettingsService: UserSettingsService = null;
	let syncService: SyncService;

	let component: ActivitiesComponent;
	let fixture: ComponentFixture<ActivitiesComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		spyOn(ChromeEventsService, "getBrowserExternalMessages").and.returnValue({
			addListener: () => {
			}
		});

		spyOn(ChromeEventsService, "getBrowserPluginId").and.returnValue(pluginId);

		activityService = TestBed.get(ActivityService);
		userSettingsService = TestBed.get(UserSettingsService);
		syncService = TestBed.get(SyncService);

		// Mocking
		spyOn(activityService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(TEST_SYNCED_ACTIVITIES)));
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL)));

		spyOn(syncService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(syncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));

		done();

	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ActivitiesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
