import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StravaConnectorComponent } from "./strava-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../../shared/services/electron/electron.service";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";

describe("StravaConnectorComponent", () => {
  let component: StravaConnectorComponent;
  let fixture: ComponentFixture<StravaConnectorComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, DesktopModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }],
    }).compileComponents();

    const electronService: ElectronService = TestBed.inject(ElectronService);
    electronService.instance = {
      ipcRenderer: {},
    };

    const electronWindow = window as ElectronWindow;
    const electronRequire = (module: string) => {
      console.log("Loading module: " + module);
      return {};
    };
    electronWindow.require = electronRequire;
    spyOn(electronWindow, "require").and.callFake(electronRequire);
    done();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StravaConnectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
