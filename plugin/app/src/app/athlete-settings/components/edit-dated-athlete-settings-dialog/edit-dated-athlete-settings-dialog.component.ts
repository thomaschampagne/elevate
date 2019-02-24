import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { DatedAthleteSettingsModel } from "@elevate/shared/models";
import * as moment from "moment";
import { DatedAthleteSettingsDialogData } from "./dated-athlete-settings-dialog-data.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import * as _ from "lodash";

@Component({
	selector: "app-edit-dated-athlete-settings-dialog",
	templateUrl: "./edit-dated-athlete-settings-dialog.component.html",
	styleUrls: ["./edit-dated-athlete-settings-dialog.component.scss"]
})
export class EditDatedAthleteSettingsDialogComponent implements OnInit {

	public static readonly WIDTH: string = "60%";

	public sinceDate: Date;

	public datedAthleteSettingsModel: DatedAthleteSettingsModel;

	public DatedAthleteSettingsAction = DatedAthleteSettingsAction;

	constructor(public dialogRef: MatDialogRef<EditDatedAthleteSettingsDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public data: DatedAthleteSettingsDialogData) {
	}

	public ngOnInit(): void {
		this.datedAthleteSettingsModel = DatedAthleteSettingsModel.asInstance(_.cloneDeep(this.data.datedAthleteSettingsModel));
		this.sinceDate = moment(this.datedAthleteSettingsModel.since).toDate();
	}

	public onAthleteSettingsModelChanged(datedAthleteSettingsModel: DatedAthleteSettingsModel): void {
		this.datedAthleteSettingsModel = datedAthleteSettingsModel;
	}

	public onDateChange(): void {
		this.datedAthleteSettingsModel.since = moment(this.sinceDate).format(DatedAthleteSettingsModel.SINCE_DATE_FORMAT);
	}

	public onConfirm(): void {
		this.dialogRef.close(this.datedAthleteSettingsModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

}
