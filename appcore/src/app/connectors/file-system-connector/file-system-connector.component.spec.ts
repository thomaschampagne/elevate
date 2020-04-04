import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FileSystemConnectorComponent } from "./file-system-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../../shared/services/electron/electron.service";

describe("FileSystemConnectorComponent", () => {
	let component: FileSystemConnectorComponent;
	let fixture: ComponentFixture<FileSystemConnectorComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			]
		}).compileComponents();

		const electronService: ElectronService = TestBed.inject(ElectronService);
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
		fixture = TestBed.createComponent(FileSystemConnectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
