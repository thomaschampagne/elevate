import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { FitnessTrendSettingsModel } from "../shared/models/fitness-trend-settings.model";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";

@Component({
	selector: "app-fitness-trend-settings-dialog",
	templateUrl: "./fitness-trend-settings-dialog.component.html",
	styleUrls: ["./fitness-trend-settings-dialog.component.scss"]
})
export class FitnessTrendSettingsDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly HeartRateImpulseMode = HeartRateImpulseMode;

	constructor(public dialogRef: MatDialogRef<FitnessTrendSettingsDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public settingsModel: FitnessTrendSettingsModel) {
	}

	public ngOnInit(): void {
	}

	public onSave(): void {
		this.dialogRef.close(this.settingsModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

	public onModeChange(): void {
		this.settingsModel.heartRateImpulseMode = Number(this.settingsModel.heartRateImpulseMode);
	}
}
