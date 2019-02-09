import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddYearProgressPresetsDialogComponent } from "./add-year-progress-presets-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { AddYearProgressPresetsDialogData } from "../shared/models/add-year-progress-presets-dialog-data";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";

describe("AddYearProgressPresetsDialogComponent", () => {
	let component: AddYearProgressPresetsDialogComponent;
	let fixture: ComponentFixture<AddYearProgressPresetsDialogComponent>;

	beforeEach((done: Function) => {

		const addYearProgressPresetsDialogData: AddYearProgressPresetsDialogData = {
			yearProgressTypeModel: new YearProgressTypeModel(ProgressType.DISTANCE, "Distance"),
			activityTypes: ["Ride", "VirtualRide"],
			includeCommuteRide: true,
			includeIndoorRide: true,
			targetValue: 5000
		};

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				YearProgressModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: addYearProgressPresetsDialogData,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(AddYearProgressPresetsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
