import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { FitnessTrendConfigModel } from "../shared/models/fitness-trend-config.model";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";

@Component({
	selector: "app-fitness-trend-config-dialog",
	templateUrl: "./fitness-trend-config-dialog.component.html",
	styleUrls: ["./fitness-trend-config-dialog.component.scss"]
})
export class FitnessTrendConfigDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly HeartRateImpulseMode = HeartRateImpulseMode;

	constructor(public dialogRef: MatDialogRef<FitnessTrendConfigDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public fitnessTrendConfigModel: FitnessTrendConfigModel,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
	}

	public onSave(): void {
		this.dialogRef.close(this.fitnessTrendConfigModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

	public onModeChange(): void {
		this.fitnessTrendConfigModel.heartRateImpulseMode = Number(this.fitnessTrendConfigModel.heartRateImpulseMode);
	}

	public onInitialFitnessChange(): void {

		if (this.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl < 0) {
			this.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl = null;
			this.snackBar.open("Invalid value entered. Reset to default value.", "Close", {
				duration: 2500
			});
		}

	}

	public onInitialFatigueChange(): void {
		if (this.fitnessTrendConfigModel.initializedFitnessTrendModel.atl < 0) {
			this.fitnessTrendConfigModel.initializedFitnessTrendModel.atl = null;
			this.snackBar.open("Invalid value entered. Reset to default value.", "Close", {
				duration: 2500
			});
		}
	}

}
