import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendConfigDialogComponent } from "./fitness-trend-config-dialog.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { FitnessTrendConfigModel } from "../shared/models/fitness-trend-config.model";
import { FitnessTrendComponent } from "../fitness-trend.component";

describe("FitnessTrendConfigDialogComponent", () => {
	let component: FitnessTrendConfigDialogComponent;
	let fixture: ComponentFixture<FitnessTrendConfigDialogComponent>;
	let fitnessTrendSettingsModel: FitnessTrendConfigModel;

	beforeEach((done: Function) => {

		fitnessTrendSettingsModel = FitnessTrendComponent.DEFAULT_CONFIG;

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
		fixture = TestBed.createComponent(FitnessTrendConfigDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
