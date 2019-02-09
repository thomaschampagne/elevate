import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { YearProgressPresetModel } from "../shared/models/year-progress-preset.model";
import { ProgressType } from "../shared/enums/progress-type.enum";

describe("ManageYearProgressPresetsDialogComponent", () => {

	const yearProgressPresetModels = [
		new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false, 750),
		new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false),
		new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], false, false, 30000),
	];

	let component: ManageYearProgressPresetsDialogComponent;
	let fixture: ComponentFixture<ManageYearProgressPresetsDialogComponent>;

	beforeEach((done: Function) => {

		const isMetric = true;
		const yearProgressTypeModels: YearProgressTypeModel[] = YearProgressService.provideProgressTypes(isMetric);

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				YearProgressModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: yearProgressTypeModels,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ManageYearProgressPresetsDialogComponent);
		component = fixture.componentInstance;
		spyOn(component.yearProgressService, "fetchPresets").and.returnValue(Promise.resolve(yearProgressPresetModels));
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
