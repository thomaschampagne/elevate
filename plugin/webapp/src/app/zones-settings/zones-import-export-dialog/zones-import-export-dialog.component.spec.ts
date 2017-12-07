import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ZonesImportExportDialogComponent } from "./zones-import-export-dialog.component";

xdescribe("ZonesImportExportDialogComponent", () => {
	let component: ZonesImportExportDialogComponent;
	let fixture: ComponentFixture<ZonesImportExportDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ZonesImportExportDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZonesImportExportDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
