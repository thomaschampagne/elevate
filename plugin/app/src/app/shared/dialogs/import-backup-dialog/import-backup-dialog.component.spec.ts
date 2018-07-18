import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportBackupDialogComponent } from "./import-backup-dialog.component";
import { CoreModule } from "../../../core/core.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SharedModule } from "../../shared.module";

describe("ImportBackupDialogComponent", () => {

	let component: ImportBackupDialogComponent;
	let fixture: ComponentFixture<ImportBackupDialogComponent>;

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
		fixture = TestBed.createComponent(ImportBackupDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
