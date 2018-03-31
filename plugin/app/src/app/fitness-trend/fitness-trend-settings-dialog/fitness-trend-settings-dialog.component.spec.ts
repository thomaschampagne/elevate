import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendSettingsDialogComponent } from "./fitness-trend-settings-dialog.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { FitnessTrendSettingsModel } from "../shared/models/fitness-trend-settings.model";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";

describe("FitnessTrendSettingsDialogComponent", () => {
	let component: FitnessTrendSettingsDialogComponent;
	let fixture: ComponentFixture<FitnessTrendSettingsDialogComponent>;
	let fitnessTrendSettingsModel: FitnessTrendSettingsModel;

	beforeEach((done: Function) => {

		fitnessTrendSettingsModel = new FitnessTrendSettingsModel();
		fitnessTrendSettingsModel.heartRateImpulseMode = HeartRateImpulseMode.HRSS;

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: fitnessTrendSettingsModel,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendSettingsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
