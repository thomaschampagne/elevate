import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FitnessTrendComponent } from "./fitness-trend.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { SyncService } from "../shared/services/sync/sync.service";
import { userSettingsData } from "@elevate/shared/data";
import { FitnessTrendModule } from "./fitness-trend.module";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import { ExternalUpdatesService } from "../shared/services/external-updates/external-updates.service";
import * as _ from "lodash";
import { ActivityService } from "../shared/services/activity/activity.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";

describe("FitnessTrendComponent", () => {

	const pluginId = "c061d18abea0";
	let activityService: ActivityService;
	let userSettingsService: UserSettingsService;
	let syncService: SyncService;
	let component: FitnessTrendComponent;
	let fixture: ComponentFixture<FitnessTrendComponent>;

	beforeEach((done: Function) => {

		spyOn(ExternalUpdatesService, "getBrowserExternalMessages").and.returnValue({
			addListener: (request: any, sender: chrome.runtime.MessageSender) => {
			}
		});

		spyOn(ExternalUpdatesService, "getBrowserPluginId").and.returnValue(pluginId);

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			]
		}).compileComponents();

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);
		userSettingsService = TestBed.get(UserSettingsService);
		syncService = TestBed.get(SyncService);

		// Mocking
		spyOn(activityService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(TEST_SYNCED_ACTIVITIES)));
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(userSettingsData)));

		spyOn(syncService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(syncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));

		fixture = TestBed.createComponent(FitnessTrendComponent);
		component = fixture.componentInstance;

		component.fitnessTrendConfigModel = FitnessTrendComponent.DEFAULT_CONFIG;

		fixture.detectChanges();

		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should keep enabled: PSS impulses, SwimSS impulses & Training Zones on toggles verification with HRSS=ON", (done: Function) => {

		// Given
		component.fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.HRSS;
		component.isTrainingZonesEnabled = true;
		component.isPowerMeterEnabled = true;
		component.isSwimEnabled = true;
		component.isEBikeRidesEnabled = true;
		const localStorageGetItemSpy = spyOn(localStorage, "getItem").and.returnValue("true"); // Indicate that toggles are enabled from user saved prefs (local storage)

		// When
		component.updateTogglesStatesAlongHrMode();

		// Then
		expect(component.isTrainingZonesEnabled).toEqual(true);
		expect(component.isPowerMeterEnabled).toEqual(true);
		expect(component.isSwimEnabled).toEqual(true);
		expect(component.isEBikeRidesEnabled).toEqual(true);
		expect(localStorageGetItemSpy).toHaveBeenCalledTimes(3);

		done();
	});

	it("should disable: PSS impulses, SwimSS impulses & Training Zones on toggles verification with TRIMP=ON", (done: Function) => {

		// Given
		component.fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		component.isTrainingZonesEnabled = true;
		component.isPowerMeterEnabled = true;
		component.isSwimEnabled = true;
		component.isEBikeRidesEnabled = true;
		const localStorageGetItemSpy = spyOn(localStorage, "getItem").and.returnValue(undefined); // Indicate that toggles are NOT enabled from user saved prefs (local storage)

		// When
		component.updateTogglesStatesAlongHrMode();

		// Then
		expect(component.isTrainingZonesEnabled).toEqual(false);
		expect(component.isPowerMeterEnabled).toEqual(false);
		expect(component.isSwimEnabled).toEqual(false);
		expect(component.isEBikeRidesEnabled).toEqual(true);
		expect(localStorageGetItemSpy).toHaveBeenCalledTimes(0);

		done();
	});

});
