import { Component, Inject, OnInit } from "@angular/core";
import { YearToDateProgressPresetModel } from "../shared/models/year-to-date-progress-preset.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { AppError } from "../../shared/models/app-error.model";
import { ProgressMode } from "../shared/enums/progress-mode.enum";
import { RollingProgressPresetModel } from "../shared/models/rolling-progress-preset.model";
import { AddRollingProgressPresetDialogData } from "../shared/models/add-rolling-progress-preset-dialog-data";
import { LoggerService } from "../../shared/services/logging/logger.service";

@Component({
	selector: "app-add-year-progress-presets-dialog",
	templateUrl: "./add-year-progress-preset-dialog.component.html",
	styleUrls: ["./add-year-progress-preset-dialog.component.scss"]
})
export class AddYearProgressPresetDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly ProgressType = ProgressType;
	public readonly ProgressMode = ProgressMode;

	public progressPresetModel: YearToDateProgressPresetModel;

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any /*AddYearToDateProgressPresetDialogData | AddRollingProgressPresetDialogData*/,
				public dialogRef: MatDialogRef<AddYearProgressPresetDialogComponent>,
				public yearProgressService: YearProgressService,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		if (this.dialogData.mode === ProgressMode.YEAR_TO_DATE) {
			this.progressPresetModel = new YearToDateProgressPresetModel(this.dialogData.yearProgressTypeModel.type, this.dialogData.activityTypes,
				this.dialogData.includeCommuteRide, this.dialogData.includeIndoorRide, this.dialogData.targetValue);
		} else {

			const rollingPresetDialogData = new AddRollingProgressPresetDialogData(this.dialogData.yearProgressTypeModel, this.dialogData.activityTypes,
				this.dialogData.includeCommuteRide, this.dialogData.includeIndoorRide, this.dialogData.targetValue,
				(<AddRollingProgressPresetDialogData> this.dialogData).rollingPeriod, (<AddRollingProgressPresetDialogData> this.dialogData).periodMultiplier);

			this.progressPresetModel = new RollingProgressPresetModel(rollingPresetDialogData.yearProgressTypeModel.type, rollingPresetDialogData.activityTypes,
				rollingPresetDialogData.includeCommuteRide, rollingPresetDialogData.includeIndoorRide, rollingPresetDialogData.targetValue, rollingPresetDialogData.rollingPeriod, rollingPresetDialogData.periodMultiplier);
		}

	}

	public onSave(): void {
		this.yearProgressService.addPreset(this.progressPresetModel).then(() => {
			this.dialogRef.close(this.progressPresetModel);
		}).catch(error => {
			this.dialogRef.close();
			this.handleErrors(error);
		});
	}

	public onTargetValueChanged(): void {
		if (this.progressPresetModel.targetValue <= 0) {
			this.progressPresetModel.targetValue = null;
		}
	}

	private handleErrors(error: any) {
		if (error instanceof AppError) {
			this.logger.warn(error);
			const message = (<AppError> error).message;
			this.snackBar.open(message, "Close", {
				duration: 5000
			});
		} else {
			this.logger.error(error);
		}
	}
}
