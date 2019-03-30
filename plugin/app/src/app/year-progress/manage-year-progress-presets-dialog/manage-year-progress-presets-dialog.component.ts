import { Component, Inject, OnInit } from "@angular/core";
import { YearProgressService } from "../shared/services/year-progress.service";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar, MatTableDataSource } from "@angular/material";
import { YearToDateProgressPresetModel } from "../shared/models/year-to-date-progress-preset.model";
import { ProgressType } from "../shared/enums/progress-type.enum";
import * as _ from "lodash";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { AppError } from "../../shared/models/app-error.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressPresetsDialogResponse } from "../shared/models/year-progress-presets-dialog-response.model";
import { ProgressMode } from "../shared/enums/progress-mode.enum";
import { LoggerService } from "../../shared/services/logging/logger.service";

@Component({
	selector: "app-manage-year-progress-presets-dialog",
	templateUrl: "./manage-year-progress-presets-dialog.component.html",
	styleUrls: ["./manage-year-progress-presets-dialog.component.scss"]
})
export class ManageYearProgressPresetsDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "100%";
	public static readonly MIN_WIDTH: string = "80%";

	public static readonly COLUMN_PROGRESS_MODE: string = "progressMode";
	public static readonly COLUMN_PROGRESS_ROLLING_PERIOD: string = "rollingPeriod";
	public static readonly COLUMN_PROGRESS_PERIOD_MULTIPLIER: string = "periodMultiplier";
	public static readonly COLUMN_PROGRESS_TYPE: string = "progressType";
	public static readonly COLUMN_ACTIVITY_TYPES: string = "activityTypes";
	public static readonly COLUMN_INCLUDE_COMMUTE_RIDE: string = "includeCommuteRide";
	public static readonly COLUMN_INCLUDE_INDOOR_RIDE: string = "includeIndoorRide";
	public static readonly COLUMN_TARGET_VALUE: string = "targetValue";
	public static readonly COLUMN_ACTION_LOAD: string = "load";
	public static readonly COLUMN_ACTION_DELETE: string = "delete";

	public readonly ProgressType = ProgressType;
	public readonly ProgressMode = ProgressMode;

	public yearProgressPresetModels: YearToDateProgressPresetModel[];
	public dataSource: MatTableDataSource<YearToDateProgressPresetModel>;
	public deletedPresets: YearToDateProgressPresetModel[];

	public readonly displayedColumns: string[] = [
		ManageYearProgressPresetsDialogComponent.COLUMN_PROGRESS_MODE,
		ManageYearProgressPresetsDialogComponent.COLUMN_PROGRESS_ROLLING_PERIOD,
		ManageYearProgressPresetsDialogComponent.COLUMN_PROGRESS_PERIOD_MULTIPLIER,
		ManageYearProgressPresetsDialogComponent.COLUMN_PROGRESS_TYPE,
		ManageYearProgressPresetsDialogComponent.COLUMN_ACTIVITY_TYPES,
		ManageYearProgressPresetsDialogComponent.COLUMN_INCLUDE_COMMUTE_RIDE,
		ManageYearProgressPresetsDialogComponent.COLUMN_INCLUDE_INDOOR_RIDE,
		ManageYearProgressPresetsDialogComponent.COLUMN_TARGET_VALUE,
		ManageYearProgressPresetsDialogComponent.COLUMN_ACTION_LOAD,
		ManageYearProgressPresetsDialogComponent.COLUMN_ACTION_DELETE
	];

	constructor(@Inject(MAT_DIALOG_DATA) public readonly yearProgressTypes: YearProgressTypeModel[],
				public dialogRef: MatDialogRef<ManageYearProgressPresetsDialogComponent>,
				public yearProgressService: YearProgressService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		this.dataSource = new MatTableDataSource<YearToDateProgressPresetModel>();
		this.deletedPresets = [];
		this.loadData();
	}

	private loadData(): void {
		this.yearProgressService.fetchPresets().then((models: YearToDateProgressPresetModel[]) => {
			this.yearProgressPresetModels = models;
			this.dataSource.data = this.yearProgressPresetModels;
		});
	}

	public progressTypeLabel(progressType: ProgressType): string {
		return _.startCase(ProgressType[progressType].toLowerCase());
	}

	public progressTypeShortUnit(progressType: ProgressType): string {
		const yearProgressTypeModel = _.find(this.yearProgressTypes, {type: progressType});
		return (yearProgressTypeModel && yearProgressTypeModel.shortUnit) ? yearProgressTypeModel.shortUnit : "";
	}

	public onLoad(presetId: string): void {
		const presetModel = _.find(this.yearProgressPresetModels, {id: presetId});
		this.dialogRef.close(new YearProgressPresetsDialogResponse(this.deletedPresets, presetModel));
	}

	public onDelete(presetId: string): void {

		const confirmDialogDataModel = new ConfirmDialogDataModel(null, "Are you sure to remove this preset?");

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			data: confirmDialogDataModel
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (confirmed) {
				const deletedPresetCopy = _.find(this.yearProgressPresetModels, {id: presetId});
				this.yearProgressService.deletePreset(presetId).then(() => {
					this.loadData();
					this.deletedPresets.push(deletedPresetCopy);
				}, error => this.handleErrors(error));
			}

			afterClosedSubscription.unsubscribe();
		});

	}

	public onBackClicked(): void {
		this.dialogRef.close(new YearProgressPresetsDialogResponse(this.deletedPresets, null));
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
