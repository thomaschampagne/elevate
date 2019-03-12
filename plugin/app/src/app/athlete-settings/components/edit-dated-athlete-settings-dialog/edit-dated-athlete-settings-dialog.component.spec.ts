import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDatedAthleteSettingsDialogComponent } from "./edit-dated-athlete-settings-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import * as _ from "lodash";
import { DatedAthleteSettingsDialogData } from "./dated-athlete-settings-dialog-data.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import { DatedAthleteSettingsModel, UserSettings } from "@elevate/shared/models";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("EditDatedAthleteSettingsDialogComponent", () => {

	let component: EditDatedAthleteSettingsDialogComponent;
	let fixture: ComponentFixture<EditDatedAthleteSettingsDialogComponent>;
	let userSettingsService: UserSettingsService;

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

		userSettingsService = TestBed.get(UserSettingsService);

		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL)));

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
