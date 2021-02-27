import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendTableComponent } from "./fitness-trend-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { TEST_SYNCED_ACTIVITIES } from "../../../shared-fixtures/activities-2015.fixture";
import { FitnessTrendModule } from "../fitness-trend.module";
import _ from "lodash";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { UserSettings } from "@elevate/shared/models";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("FitnessTrendTableComponent", () => {
  let activityService: ActivityService = null;
  let userSettingsService: UserSettingsService = null;

  let component: FitnessTrendTableComponent;
  let fixture: ComponentFixture<FitnessTrendTableComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, FitnessTrendModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    activityService = TestBed.inject(ActivityService);
    userSettingsService = TestBed.inject(UserSettingsService);

    // Mocking
    spyOn(activityService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(TEST_SYNCED_ACTIVITIES)));
    spyOn(userSettingsService, "fetch").and.returnValue(
      Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL))
    );

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(FitnessTrendTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
