import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressOverviewDialogComponent } from "./year-progress-overview-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { YearProgressForOverviewModel } from "../shared/models/year-progress-for-overview.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import * as moment from "moment";

describe("YearProgressOverviewDialogComponent", () => {

	let component: YearProgressOverviewDialogComponent;
	let fixture: ComponentFixture<YearProgressOverviewDialogComponent>;

	const yearsColorsMap = new Map<number, string>();
	yearsColorsMap.set(2015, "red");
	yearsColorsMap.set(2016, "blue");
	yearsColorsMap.set(2017, "green");
	yearsColorsMap.set(2018, "purple");
	const colors: string [] = ["red", "blue", "green", "purple"];

	const yearProgressForOverviewModel: YearProgressForOverviewModel = {
		momentWatched: moment(),
		selectedYears: [2017, 2016],
		selectedActivityTypes: ["Ride", "Run"],
		yearProgressStyleModel: new YearProgressStyleModel(yearsColorsMap, colors),
		yearProgressions: [],
		progressTypes: []
	};

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				YearProgressModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: yearProgressForOverviewModel,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(YearProgressOverviewDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
