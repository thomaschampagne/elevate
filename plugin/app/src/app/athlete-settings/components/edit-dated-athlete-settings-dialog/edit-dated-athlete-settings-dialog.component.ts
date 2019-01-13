import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS } from "@angular/material-moment-adapter";
import { DatedAthleteSettingsModel } from "@elevate/shared/models";
import * as moment from "moment";
import { DatedAthleteSettingsDialogData } from "./dated-athlete-settings-dialog-data.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import * as _ from "lodash";

@Component({
	selector: "app-edit-dated-athlete-settings-dialog",
	templateUrl: "./edit-dated-athlete-settings-dialog.component.html",
	styleUrls: ["./edit-dated-athlete-settings-dialog.component.scss"],
	providers: [
		{provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
		{provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
	]
})
export class EditDatedAthleteSettingsDialogComponent implements OnInit {

	public static readonly WIDTH: string = "60%";

	public datedAthleteSettingsModel: DatedAthleteSettingsModel;

	public DatedAthleteSettingsAction = DatedAthleteSettingsAction;

	constructor(public dialogRef: MatDialogRef<EditDatedAthleteSettingsDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public data: DatedAthleteSettingsDialogData) {
	}

	public ngOnInit(): void {
		this.datedAthleteSettingsModel = DatedAthleteSettingsModel.asInstance(_.cloneDeep(this.data.datedAthleteSettingsModel));
	}

	public onAthleteSettingsModelChanged(datedAthleteSettingsModel: DatedAthleteSettingsModel): void {
		this.datedAthleteSettingsModel = datedAthleteSettingsModel;
	}

	public onDateChange(): void {
		this.datedAthleteSettingsModel.since = moment(this.datedAthleteSettingsModel.since).format(DatedAthleteSettingsModel.SINCE_DATE_FORMAT);
	}

	public onConfirm(): void {
		this.dialogRef.close(this.datedAthleteSettingsModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

}
