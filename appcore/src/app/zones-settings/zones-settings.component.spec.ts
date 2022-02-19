import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZonesSettingsComponent } from "./zones-settings.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import _ from "lodash";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { IpcRendererTunnelServiceMock } from "../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../desktop/ipc/ipc-tunnel-service.token";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ZonesSettingsModule } from "./zones-settings.module";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("ZonesSettingsComponent", () => {
  let component: ZonesSettingsComponent;
  let fixture: ComponentFixture<ZonesSettingsComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, ZonesSettingsModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(ZonesSettingsComponent);
    component = fixture.componentInstance;

    spyOn(component.userSettingsService, "fetch").and.returnValue(
      Promise.resolve(_.cloneDeep(DesktopUserSettings.DEFAULT_MODEL))
    );

    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
