import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPeriodicAthleteSettingsDialogComponent } from "./edit-periodic-athlete-settings-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { UserSettingsDao } from "../../../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettings } from "../../../../../../shared/UserSettings";
import { PeriodicAthleteSettingsDialogData } from "./periodic-athlete-settings-dialog-data.model";
import { PeriodicAthleteSettingsAction } from "./periodic-athlete-settings-action.enum";

describe("EditPeriodicAthleteSettingsDialogComponent", () => {

	let component: EditPeriodicAthleteSettingsDialogComponent;
	let fixture: ComponentFixture<EditPeriodicAthleteSettingsDialogComponent>;
	let userSettingsDao: UserSettingsDao;

	beforeEach((done: Function) => {

		const periodicAthleteSettingsDialogData: PeriodicAthleteSettingsDialogData = {
			action: PeriodicAthleteSettingsAction.ACTION_ADD
		};

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: periodicAthleteSettingsDialogData,
				},
				{
					provide: MatDialogRef, useValue: {},
				}
			]
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(EditPeriodicAthleteSettingsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
