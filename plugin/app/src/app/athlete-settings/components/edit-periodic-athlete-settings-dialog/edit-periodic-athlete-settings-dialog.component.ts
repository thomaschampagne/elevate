import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as moment from "moment";
import { PeriodicAthleteSettingsDialogData } from "./periodic-athlete-settings-dialog-data.model";
import { PeriodicAthleteSettingsAction } from "./periodic-athlete-settings-action.enum";
import * as _ from "lodash";

@Component({
	selector: "app-edit-periodic-athlete-settings-dialog",
	templateUrl: "./edit-periodic-athlete-settings-dialog.component.html",
	styleUrls: ["./edit-periodic-athlete-settings-dialog.component.scss"]
})
export class EditPeriodicAthleteSettingsDialogComponent implements OnInit {

	public static readonly WIDTH: string = "60%";

	public periodicAthleteSettingsModel: PeriodicAthleteSettingsModel;

	public PeriodicAthleteSettingsAction = PeriodicAthleteSettingsAction;

	constructor(public dialogRef: MatDialogRef<EditPeriodicAthleteSettingsDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public data: PeriodicAthleteSettingsDialogData) {
	}

	public ngOnInit(): void {

		if (this.data.action === PeriodicAthleteSettingsAction.ACTION_ADD) {
			this.periodicAthleteSettingsModel = PeriodicAthleteSettingsModel.asInstance(_.cloneDeep(PeriodicAthleteSettingsModel.DEFAULT_MODEL)); // Use default model on update
		} else if (this.data.action === PeriodicAthleteSettingsAction.ACTION_EDIT) {
			this.periodicAthleteSettingsModel = PeriodicAthleteSettingsModel.asInstance(_.cloneDeep(this.data.periodicAthleteSettingsModel));
		}

	}

	public onAthleteSettingsModelChanged(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel): void {
		this.periodicAthleteSettingsModel = periodicAthleteSettingsModel;
	}

	public onDateChange(): void {
		this.periodicAthleteSettingsModel.since = moment(this.periodicAthleteSettingsModel.since).format(PeriodicAthleteSettingsModel.SINCE_DATE_FORMAT);
	}

	public onConfirm(): void {
		this.dialogRef.close(this.periodicAthleteSettingsModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

}
