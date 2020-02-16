import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FileSystemConnectorComponent } from "./file-system-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";

describe("FileSystemConnectorComponent", () => {
	let component: FileSystemConnectorComponent;
	let fixture: ComponentFixture<FileSystemConnectorComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FileSystemConnectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
