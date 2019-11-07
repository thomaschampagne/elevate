import { TestBed } from "@angular/core/testing";

import { StravaConnectorService } from "./strava-connector.service";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop.module";
import { ElectronService, ElectronWindow } from "../../shared/services/electron/electron.service";

describe("StravaConnectorService", () => {
	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			]
		}).compileComponents();

		const electronService: ElectronService = TestBed.get(ElectronService);
		electronService.instance = <Electron.RendererInterface> {
			ipcRenderer: {}
		};

		const electronWindow = (window as ElectronWindow);
		const electronRequire = (module: string) => {
			console.log("Loading module: " + module);
			return {} as Electron.RendererInterface;
		};
		electronWindow.require = electronRequire;
		spyOn(electronWindow, "require").and.callFake(electronRequire);

		done();
	});

	it("should be created", () => {
		const service: StravaConnectorService = TestBed.get(StravaConnectorService);
		expect(service).toBeTruthy();
	});
});
