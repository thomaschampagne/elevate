import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as moment from "moment";
import { PeriodicAthleteSettingsDialogData } from "./periodic-athlete-settings-dialog-data.model";
import { PeriodicAthleteSettingsAction } from "./periodic-athlete-settings-action.enum";

@Component({
	selector: "app-edit-periodic-athlete-settings-dialog",
	templateUrl: "./edit-periodic-athlete-settings-dialog.component.html",
	styleUrls: ["./edit-periodic-athlete-settings-dialog.component.scss"]
})
export class EditPeriodicAthleteSettingsDialogComponent implements OnInit {

	public periodicAthleteSettingsModel: PeriodicAthleteSettingsModel;

	public PeriodicAthleteSettingsAction = PeriodicAthleteSettingsAction;

	constructor(public dialogRef: MatDialogRef<EditPeriodicAthleteSettingsDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public data: PeriodicAthleteSettingsDialogData) {
	}

	public ngOnInit(): void {

		if (this.data.action === PeriodicAthleteSettingsAction.ACTION_ADD) {
			this.periodicAthleteSettingsModel = PeriodicAthleteSettingsModel.DEFAULT_MODEL; // Use default model on init
		} else if (this.data.action === PeriodicAthleteSettingsAction.ACTION_EDIT) {
			this.periodicAthleteSettingsModel = this.data.periodicAthleteSettingsModel;
		}

	}

	public onAthleteSettingsModelChanged(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel): void {
		this.periodicAthleteSettingsModel = periodicAthleteSettingsModel;
	}

	public onPeriodChange(): void {
		this.periodicAthleteSettingsModel.from = moment(this.periodicAthleteSettingsModel.from).format(PeriodicAthleteSettingsModel.FROM_DATE_FORMAT);
	}

	public onConfirm(): void {
		this.dialogRef.close(this.periodicAthleteSettingsModel);
	}
}
