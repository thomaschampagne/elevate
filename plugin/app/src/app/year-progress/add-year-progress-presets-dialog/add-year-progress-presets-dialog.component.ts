import { Component, Inject, OnInit } from "@angular/core";
import { YearProgressPresetModel } from "../shared/models/year-progress-preset.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { MAT_DIALOG_DATA } from "@angular/material";
import { ProgressType } from "../shared/models/progress-type.enum";
import { AddYearProgressPresetsDialogData } from "../shared/models/add-year-progress-presets-dialog-data";

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

	constructor(public yearProgressService: YearProgressService,
				@Inject(MAT_DIALOG_DATA) public dialogData: AddYearProgressPresetsDialogData) {
	}

	public ngOnInit(): void {
		this.yearProgressPresetModel = new YearProgressPresetModel(this.dialogData.yearProgressTypeModel.type,
			this.dialogData.activityTypes, this.dialogData.includeCommuteRide, this.dialogData.includeIndoorRide, this.dialogData.targetValue);
	}

	public onSave(): void {
		this.yearProgressService.addPreset(this.yearProgressPresetModel).catch(error => alert(error));
	}

	public onTargetValueChanged(): void {
		if (this.yearProgressPresetModel.targetValue <= 0) {
			this.yearProgressPresetModel.targetValue = null;
		}
	}
}
