import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteHistoryImportDialogComponent } from "./athlete-history-import-dialog.component";
import { CoreModule } from "../../../core/core.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SharedModule } from "../../shared.module";

describe("AthleteHistoryImportDialogComponent", () => {

	let component: AthleteHistoryImportDialogComponent;
	let fixture: ComponentFixture<AthleteHistoryImportDialogComponent>;

	beforeEach((done: Function) => {
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

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteHistoryImportDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
