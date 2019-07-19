import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StravaConnectorComponent } from "./strava-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop.module";
import { ElectronService, ElectronWindow } from "../../shared/services/electron/electron.service";

describe("StravaConnectorComponent", () => {
	let component: StravaConnectorComponent;
	let fixture: ComponentFixture<StravaConnectorComponent>;

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

	beforeEach(() => {
		fixture = TestBed.createComponent(StravaConnectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
