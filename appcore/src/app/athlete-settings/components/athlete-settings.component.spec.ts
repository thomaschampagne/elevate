import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteSettingsComponent } from "./athlete-settings.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { AthleteSettingsModule } from "../athlete-settings.module";
import _ from "lodash";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { TargetBootModule } from "../../boot/desktop-boot.module";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("AthleteSettingsComponent", () => {
  let component: AthleteSettingsComponent;
  let fixture: ComponentFixture<AthleteSettingsComponent>;
  let userSettingsService: UserSettingsService;
  let athleteService: AthleteService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetBootModule, TargetModule, AthleteSettingsModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    userSettingsService = TestBed.inject(UserSettingsService);
    athleteService = TestBed.inject(AthleteService);

    spyOn(userSettingsService, "fetch").and.returnValue(
      Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL))
    );
    spyOn(athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(AthleteSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
