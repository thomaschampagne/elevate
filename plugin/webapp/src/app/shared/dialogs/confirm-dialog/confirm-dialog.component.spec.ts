import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfirmDialog } from "./confirm-dialog.component";

xdescribe("ConfirmDialogComponent", () => {
	let component: ConfirmDialog;
	let fixture: ComponentFixture<ConfirmDialog>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ConfirmDialog]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ConfirmDialog);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
