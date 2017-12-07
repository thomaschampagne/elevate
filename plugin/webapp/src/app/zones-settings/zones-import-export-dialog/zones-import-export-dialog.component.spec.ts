import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ZonesImportExportDialog } from "./zones-import-export-dialog.component";

xdescribe("ZonesImportExportDialogComponent", () => {
	let component: ZonesImportExportDialog;
	let fixture: ComponentFixture<ZonesImportExportDialog>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ZonesImportExportDialog]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZonesImportExportDialog);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
