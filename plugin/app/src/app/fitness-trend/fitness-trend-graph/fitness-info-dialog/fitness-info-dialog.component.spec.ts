import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessInfoDialogComponent } from "./fitness-info-dialog.component";
import { CoreModule } from "../../../core/core.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SharedModule } from "../../../shared/shared.module";

describe("FitnessInfoDialogComponent", () => {
	let component: FitnessInfoDialogComponent;
	let fixture: ComponentFixture<FitnessInfoDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			declarations: [],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: {},
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessInfoDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {

		// Given, When
		const compiled = fixture.debugElement.nativeElement;
		const htmlContent = compiled.querySelector("mat-dialog-content").textContent;

		// Then
		expect(component).toBeTruthy();
		expect(htmlContent).not.toBeNull();
	});

	/*
	afterEach(() => {
		fixture.destroy();
	});
	*/

});
