import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConnectorsComponent } from "./connectors.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { DesktopModule } from "../shared/modules/desktop.module";
import { ElectronService, ElectronWindow } from "../shared/services/electron/electron.service";

describe("ConnectorsComponent", () => {
	let component: ConnectorsComponent;
	let fixture: ComponentFixture<ConnectorsComponent>;

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
		fixture = TestBed.createComponent(ConnectorsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
