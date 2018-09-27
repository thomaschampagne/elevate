import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDatedAthleteSettingsDialogComponent } from "./edit-dated-athlete-settings-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { UserSettingsDao } from "../../../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettingsData } from "../../../../../../core/scripts/shared/user-settings.data";
import { DatedAthleteSettingsDialogData } from "./dated-athlete-settings-dialog-data.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import { DatedAthleteSettingsModel } from "../../../shared/models/athlete/athlete-settings/dated-athlete-settings.model";

describe("EditDatedAthleteSettingsDialogComponent", () => {

	let component: EditDatedAthleteSettingsDialogComponent;
	let fixture: ComponentFixture<EditDatedAthleteSettingsDialogComponent>;
	let userSettingsDao: UserSettingsDao;

	beforeEach((done: Function) => {

		const datedAthleteSettingsDialogData: DatedAthleteSettingsDialogData = {
			action: DatedAthleteSettingsAction.ACTION_ADD,
			datedAthleteSettingsModel: DatedAthleteSettingsModel.DEFAULT_MODEL
		};

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: datedAthleteSettingsDialogData,
				},
				{
					provide: MatDialogRef, useValue: {},
				}
			]
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettingsData));
			}
		});

		fixture = TestBed.createComponent(EditDatedAthleteSettingsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
