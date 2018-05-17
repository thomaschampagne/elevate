import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FitnessTrendComponent } from "./fitness-trend.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { SyncService } from "../shared/services/sync/sync.service";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { userSettings } from "../../../../shared/UserSettings";
import { FitnessTrendModule } from "./fitness-trend.module";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import { Gender } from "../shared/enums/gender.enum";
import { ExternalUpdatesService } from "../shared/services/external-updates/external-updates.service";
import { UserLactateThresholdModel } from "../../../../shared/models/user-settings/user-lactate-threshold.model";
import * as _ from "lodash";

describe("FitnessTrendComponent", () => {

	const pluginId = "c061d18abea0";
	const gender = "men";
	const userGender = Gender.MEN;
	const maxHr = 200;
	const restHr = 50;
	const cyclingFtp = 150;
	const swimFtp = 31;
	const weight = 75;
	const userLactateThreshold: UserLactateThresholdModel = {
		default: 175,
		cycling: null,
		running: null
	};

	let activityDao: ActivityDao;
	let userSettingsDao: UserSettingsDao;
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
		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);
		userSettingsDao = TestBed.get(UserSettingsDao);
		syncService = TestBed.get(SyncService);

		// Mocking chrome storage
		spyOn(activityDao, "browserStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({syncedActivities: _.cloneDeep(TEST_SYNCED_ACTIVITIES)});
			}
		});

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettings);
			},
			set: (keys: any, callback: () => {}) => {
				callback();
			}
		});

		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		spyOn(syncService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(syncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(FitnessTrendComponent);
		component = fixture.componentInstance;

		component.fitnessUserSettingsModel = {
			userGender: userGender,
			userMaxHr: maxHr,
			userRestHr: restHr,
			userLactateThreshold: userLactateThreshold,
			cyclingFtp: cyclingFtp,
			runningFtp: null,
			swimFtp: swimFtp,
		};

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
		component.fitnessUserSettingsModel.cyclingFtp = 250;
		component.fitnessUserSettingsModel.swimFtp = 40;
		const localStorageGetItemSpy = spyOn(localStorage, "getItem").and.returnValue("true"); // Indicate that toggles are enabled from user saved prefs (local storage)

		// When
		component.verifyTogglesStatesAlongHrMode();

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
		component.fitnessUserSettingsModel.cyclingFtp = 250;
		component.fitnessUserSettingsModel.swimFtp = 40;
		const localStorageGetItemSpy = spyOn(localStorage, "getItem").and.returnValue(undefined); // Indicate that toggles are NOT enabled from user saved prefs (local storage)

		// When
		component.verifyTogglesStatesAlongHrMode();

		// Then
		expect(component.isTrainingZonesEnabled).toEqual(false);
		expect(component.isPowerMeterEnabled).toEqual(false);
		expect(component.isSwimEnabled).toEqual(false);
		expect(component.isEBikeRidesEnabled).toEqual(true);
		expect(localStorageGetItemSpy).toHaveBeenCalledTimes(0);

		done();
	});
});
