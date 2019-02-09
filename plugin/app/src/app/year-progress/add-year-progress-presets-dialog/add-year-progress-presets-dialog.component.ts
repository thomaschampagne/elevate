import { Component, Inject, OnInit } from "@angular/core";
import { YearProgressPresetModel } from "../shared/models/year-progress-preset.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { AddYearProgressPresetsDialogData } from "../shared/models/add-year-progress-presets-dialog-data";
import { AppError } from "../../shared/models/app-error.model";

@Component({
	selector: "app-add-year-progress-presets-dialog",
	templateUrl: "./add-year-progress-presets-dialog.component.html",
	styleUrls: ["./add-year-progress-presets-dialog.component.scss"]
})
export class AddYearProgressPresetsDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly ProgressType = ProgressType;

	public yearProgressPresetModel: YearProgressPresetModel;

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: AddYearProgressPresetsDialogData,
				public dialogRef: MatDialogRef<AddYearProgressPresetsDialogComponent>,
				public yearProgressService: YearProgressService,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
		this.yearProgressPresetModel = new YearProgressPresetModel(this.dialogData.yearProgressTypeModel.type,
			this.dialogData.activityTypes, this.dialogData.includeCommuteRide, this.dialogData.includeIndoorRide, this.dialogData.targetValue);
	}

	public onSave(): void {
		this.yearProgressService.addPreset(this.yearProgressPresetModel).then(() => {
			this.dialogRef.close(this.yearProgressPresetModel);
		}).catch(error => {
			this.dialogRef.close();
			this.handleErrors(error);
		});
	}

	public onTargetValueChanged(): void {
		if (this.yearProgressPresetModel.targetValue <= 0) {
			this.yearProgressPresetModel.targetValue = null;
		}
	}

	private handleErrors(error: any) {
		if (error instanceof AppError) {
			console.warn(error);
			const message = (<AppError> error).message;
			this.snackBar.open(message, "Close", {
				duration: 5000
			});
		} else {
			console.error(error);
		}
	}
}
