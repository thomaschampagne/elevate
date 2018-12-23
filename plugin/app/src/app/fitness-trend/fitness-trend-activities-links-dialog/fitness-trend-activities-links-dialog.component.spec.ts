import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendActivitiesLinksDialogComponent } from "./fitness-trend-activities-links-dialog.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { DayStressModel } from "../shared/models/day-stress.model";

describe("FitnessTrendActivitiesLinksDialogComponent", () => {
	let component: FitnessTrendActivitiesLinksDialogComponent;
	let fixture: ComponentFixture<FitnessTrendActivitiesLinksDialogComponent>;

	const dayFitnessTrendModel: DayFitnessTrendModel = new DayFitnessTrendModel(new DayStressModel(new Date(), false), 0, 0, 0);

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: dayFitnessTrendModel,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(FitnessTrendActivitiesLinksDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
