import { TestBed } from "@angular/core/testing";

import { StravaConnectorService } from "./strava-connector.service";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../../shared/services/electron/electron.service";

describe("StravaConnectorService", () => {
    beforeEach(done => {
        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                SharedModule,
                DesktopModule
            ]
        }).compileComponents();

        const electronService: ElectronService = TestBed.inject(ElectronService);
        electronService.instance = {
            ipcRenderer: {}
        };

        const electronWindow = (window as ElectronWindow);
        const electronRequire = (module: string) => {
            console.log("Loading module: " + module);
            return {};
        };
        electronWindow.require = electronRequire;
        spyOn(electronWindow, "require").and.callFake(electronRequire);

        done();
    });

    it("should be created", () => {
        const service: StravaConnectorService = TestBed.inject(StravaConnectorService);
        expect(service).toBeTruthy();
    });
});
