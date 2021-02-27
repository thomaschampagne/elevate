import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GlobalSettingsComponent } from "./global-settings.component";
import { SharedModule } from "../shared/shared.module";
import _ from "lodash";
import { CoreModule } from "../core/core.module";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettings } from "@elevate/shared/models";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../desktop/ipc/ipc-renderer-tunnel-service.mock";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("GlobalSettingsComponent", () => {
  let component: GlobalSettingsComponent;
  let fixture: ComponentFixture<GlobalSettingsComponent>;
  let userSettingsService: UserSettingsService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      declarations: [],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    userSettingsService = TestBed.inject(UserSettingsService);
    spyOn(userSettingsService, "fetch").and.returnValue(
      Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL))
    );

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(GlobalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
