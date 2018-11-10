import * as _ from "lodash";
import * as moment from "moment";
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";
import { FitnessTrendConfigDialogData } from "../shared/models/fitness-trend-config-dialog-data.model";

@Component({
	selector: "app-fitness-trend-config-dialog",
	templateUrl: "./fitness-trend-config-dialog.component.html",
	styleUrls: ["./fitness-trend-config-dialog.component.scss"]
})
export class FitnessTrendConfigDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly HeartRateImpulseMode = HeartRateImpulseMode;

	public ignoreActivityNamePatterns: string = null;
	public ignoreBeforeDate: Date = null;
	public ignoreBeforeMaxDate: Date = null;
	public isEstimatedPowerStressScoreToggleEnabled: boolean;
	public isEstimatedRunningStressScoreToggleEnabled: boolean;
	public initialized = false;

	constructor(public dialogRef: MatDialogRef<FitnessTrendConfigDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public fitnessTrendConfigDialogData: FitnessTrendConfigDialogData,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		if (this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreActivityNamePatterns) {
			this.ignoreActivityNamePatterns = this.formatPatternsForDisplay(this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreActivityNamePatterns);
		}

		if (this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreBeforeDate) {
			this.ignoreBeforeDate = moment(this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreBeforeDate).toDate();
		}

		if (this.fitnessTrendConfigDialogData.lastFitnessActiveDate) {
			this.ignoreBeforeMaxDate = this.fitnessTrendConfigDialogData.lastFitnessActiveDate;
		}

		this.updateEstimatedStressScoresToggles();

		_.defer(() => {
			this.initialized = true;
		});
	}

	public updateEstimatedStressScoresToggles(): void {

		this.isEstimatedPowerStressScoreToggleEnabled = this.fitnessTrendConfigDialogData.isPowerMeterEnabled
			&& this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS;

		this.isEstimatedRunningStressScoreToggleEnabled = this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS;

	}

	public onSave(): void {
		this.dialogRef.close(this.fitnessTrendConfigDialogData.fitnessTrendConfigModel);
	}

	public onCancel(): void {
		this.dialogRef.close();
	}

	public onModeChange(): void {
		this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.heartRateImpulseMode = Number(this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.heartRateImpulseMode);
		this.updateEstimatedStressScoresToggles();
	}

	public onInitialFitnessChange(): void {

		if (this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl < 0) {
			this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl = null;
			this.snackBar.open("Invalid value entered. Reset to default value.", "Close", {
				duration: 2500
			});
		}

	}

	public onInitialFatigueChange(): void {
		if (this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.initializedFitnessTrendModel.atl < 0) {
			this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.initializedFitnessTrendModel.atl = null;
			this.snackBar.open("Invalid value entered. Reset to default value.", "Close", {
				duration: 2500
			});
		}
	}

	public onIgnoreActivityNamePatternsChange(): void {
		this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreActivityNamePatterns = this.formatPatternsForStorage(this.ignoreActivityNamePatterns);
	}

	public onIgnoreBeforeDateChange(): void {
		this.fitnessTrendConfigDialogData.fitnessTrendConfigModel.ignoreBeforeDate = (this.ignoreBeforeDate) ? this.ignoreBeforeDate.toISOString() : null;
	}

	public formatPatternsForStorage(userInputPatterns: string): string[] {

		// Split with carriage return
		let patternsList: string[] = userInputPatterns.split(/\r?\n/);

		// Remove spaces
		patternsList = _.map(patternsList, (pattern: string) => {
			return pattern.trim();
		});

		// Remove empty patterns
		patternsList = _.compact(patternsList);

		// Remove duplicate patterns
		patternsList = _.uniq(patternsList);

		return (patternsList.length > 0) ? patternsList : null;
	}

	public formatPatternsForDisplay(patterns: string[]): string {
		return patterns.join("\n");
	}
}
