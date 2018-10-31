import { Component, Inject, OnInit } from "@angular/core";
import { YearProgressService } from "../shared/services/year-progress.service";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar, MatTableDataSource } from "@angular/material";
import { YearProgressPresetModel } from "../shared/models/year-progress-preset.model";
import { ProgressType } from "../shared/models/progress-type.enum";
import * as _ from "lodash";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { AppError } from "../../shared/models/app-error.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";

@Component({
	selector: "app-manage-year-progress-presets-dialog",
	templateUrl: "./manage-year-progress-presets-dialog.component.html",
	styleUrls: ["./manage-year-progress-presets-dialog.component.scss"]
})
export class ManageYearProgressPresetsDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "90%";
	public static readonly MIN_WIDTH: string = "60%";

	public static readonly COLUMN_PROGRESS_TYPE: string = "progressType";
	public static readonly COLUMN_ACTIVITY_TYPES: string = "activityTypes";
	public static readonly COLUMN_INCLUDE_COMMUTE_RIDE: string = "includeCommuteRide";
	public static readonly COLUMN_INCLUDE_INDOOR_RIDE: string = "includeIndoorRide";
	public static readonly COLUMN_TARGET_VALUE: string = "targetValue";
	public static readonly COLUMN_ACTION_LOAD: string = "load";
	public static readonly COLUMN_ACTION_DELETE: string = "delete";

	public readonly ProgressType = ProgressType;

	public yearProgressPresetModels: YearProgressPresetModel[];

	public dataSource: MatTableDataSource<YearProgressPresetModel>;

	public readonly displayedColumns: string[] = [
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
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
		this.dataSource = new MatTableDataSource<YearProgressPresetModel>();
		this.loadData();
	}

	private loadData(): void {
		this.yearProgressService.fetchPresets().then((models: YearProgressPresetModel[]) => {
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

	public onLoad(rowId: number): void {
		this.dialogRef.close(this.yearProgressPresetModels[rowId]);
	}

	public onDelete(rowId: number): void {

		const confirmDialogDataModel = new ConfirmDialogDataModel(null, "Are you sure to remove this preset?");

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			data: confirmDialogDataModel
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (confirmed) {
				this.yearProgressService.deletePreset(rowId).then(() => this.loadData(),
					error => this.handleErrors(error));
			}

			afterClosedSubscription.unsubscribe();
		});

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
