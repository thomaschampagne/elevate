import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfirmDialogComponent } from "./confirm-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { ConfirmDialogDataModel } from "./confirm-dialog-data.model";

describe("ConfirmDialogComponent", () => {

	const dialogTitle = "Hello World";
	const dialogContent = "Oh my god !";

	let component: ConfirmDialogComponent;
	let fixture: ComponentFixture<ConfirmDialogComponent>;
	let confirmDialogDataModel;

	beforeEach((done: Function) => {

		confirmDialogDataModel = new ConfirmDialogDataModel(dialogTitle, dialogContent);

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			declarations: [],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: confirmDialogDataModel,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ConfirmDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should render the confirm dialog", (done: Function) => {

		// Given
		const fixture = TestBed.createComponent(ConfirmDialogComponent);
		const compiled = fixture.debugElement.nativeElement;

		// When
		fixture.detectChanges();

		// Then
		expect(component.dialogData.title).toEqual(confirmDialogDataModel.title);
		expect(component.dialogData.content).toEqual(confirmDialogDataModel.content);
		expect(compiled.querySelector("h2").textContent).toContain(dialogTitle);
		expect(compiled.querySelector("mat-dialog-content").textContent).toContain(dialogContent);
		done();
	});
});
