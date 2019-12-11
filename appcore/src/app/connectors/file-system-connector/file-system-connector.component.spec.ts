import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FileSystemConnectorComponent } from "./file-system-connector.component";

describe("FileSystemConnectorComponent", () => {
	let component: FileSystemConnectorComponent;
	let fixture: ComponentFixture<FileSystemConnectorComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FileSystemConnectorComponent]
		})
			.compileComponents();
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
