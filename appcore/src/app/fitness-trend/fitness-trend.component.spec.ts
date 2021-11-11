import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FitnessTrendComponent } from "./fitness-trend.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import ACTIVITIES_FIXTURES from "../../shared-fixtures/activities-2015.fixture.json";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { SyncService } from "../shared/services/sync/sync.service";
import { FitnessTrendModule } from "./fitness-trend.module";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import _ from "lodash";
import { ActivityService } from "../shared/services/activity/activity.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { Injectable } from "@angular/core";
import { AppService } from "../shared/services/app-service/app.service";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("FitnessTrendComponent", () => {
  let activityService: ActivityService;
  let userSettingsService: UserSettingsService;
  let syncService: SyncService<any>;
  let component: FitnessTrendComponent;
  let fixture: ComponentFixture<FitnessTrendComponent>;

  @Injectable()
  class MockAppService extends AppService {}

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, FitnessTrendModule],
      providers: [
        { provide: AppService, useClass: MockAppService },
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    // Retrieve injected service
    activityService = TestBed.inject(ActivityService);
    userSettingsService = TestBed.inject(UserSettingsService);
    syncService = TestBed.inject(SyncService);

    // Mocking
    spyOn(activityService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(ACTIVITIES_FIXTURES)));
    spyOn(userSettingsService, "fetch").and.returnValue(
      Promise.resolve(_.cloneDeep(DesktopUserSettings.DEFAULT_MODEL))
    );

    spyOn(syncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));

    fixture = TestBed.createComponent(FitnessTrendComponent);
    component = fixture.componentInstance;

    component.fitnessTrendConfigModel = FitnessTrendComponent.DEFAULT_CONFIG;

    fixture.detectChanges();

    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should keep enabled: PSS impulses, SwimSS impulses & Training Zones on toggles verification with HRSS=ON", done => {
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

  it("should disable: PSS impulses, SwimSS impulses & Training Zones on toggles verification with TRIMP=ON", done => {
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
