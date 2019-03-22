import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { MatDialog, MatSnackBar, MatTableDataSource } from "@angular/material";
import { AthleteModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { AthleteService } from "../../../shared/services/athlete/athlete.service";
import { EditDatedAthleteSettingsDialogComponent } from "../edit-dated-athlete-settings-dialog/edit-dated-athlete-settings-dialog.component";
import * as _ from "lodash";
import { DatedAthleteSettingsTableModel } from "./models/dated-athlete-settings-table.model";
import { DatedAthleteSettingsAction } from "../edit-dated-athlete-settings-dialog/dated-athlete-settings-action.enum";
import { DatedAthleteSettingsDialogData } from "../edit-dated-athlete-settings-dialog/dated-athlete-settings-dialog-data.model";
import { ConfirmDialogComponent } from "../../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { AppError } from "../../../shared/models/app-error.model";
import { LoggerService } from "../../../shared/services/logging/logger.service";

@Component({
	selector: "app-dated-athlete-settings-manager",
	templateUrl: "./dated-athlete-settings-manager.component.html",
	styleUrls: ["./dated-athlete-settings-manager.component.scss"]
})
export class DatedAthleteSettingsManagerComponent implements OnInit {

	public static readonly COLUMN_SINCE: string = "since";
	public static readonly COLUMN_UNTIL: string = "until";
	public static readonly COLUMN_WEIGHT: string = "weight";
	public static readonly COLUMN_MAX_HR: string = "maxHr";
	public static readonly COLUMN_REST_HR: string = "restHr";
	public static readonly COLUMN_LTHR_DEFAULT: string = "lthr.default";
	public static readonly COLUMN_LTHR_CYCLING: string = "lthr.cycling";
	public static readonly COLUMN_LTHR_RUNNING: string = "lthr.running";
	public static readonly COLUMN_CYCLING_FTP: string = "cyclingFtp";
	public static readonly COLUMN_RUNNING_FTP: string = "runningFtp";
	public static readonly COLUMN_SWIM_FTP: string = "swimFtp";
	public static readonly COLUMN_ACTION_EDIT: string = "edit";
	public static readonly COLUMN_ACTION_DELETE: string = "delete";

	public readonly displayedColumns: string[] = [
		DatedAthleteSettingsManagerComponent.COLUMN_SINCE,
		DatedAthleteSettingsManagerComponent.COLUMN_UNTIL,
		DatedAthleteSettingsManagerComponent.COLUMN_WEIGHT,
		DatedAthleteSettingsManagerComponent.COLUMN_MAX_HR,
		DatedAthleteSettingsManagerComponent.COLUMN_REST_HR,
		DatedAthleteSettingsManagerComponent.COLUMN_LTHR_DEFAULT,
		DatedAthleteSettingsManagerComponent.COLUMN_LTHR_CYCLING,
		DatedAthleteSettingsManagerComponent.COLUMN_LTHR_RUNNING,
		DatedAthleteSettingsManagerComponent.COLUMN_CYCLING_FTP,
		DatedAthleteSettingsManagerComponent.COLUMN_RUNNING_FTP,
		DatedAthleteSettingsManagerComponent.COLUMN_SWIM_FTP,
		DatedAthleteSettingsManagerComponent.COLUMN_ACTION_EDIT,
		DatedAthleteSettingsManagerComponent.COLUMN_ACTION_DELETE
	];

	public datedAthleteSettingsModels: DatedAthleteSettingsModel[];

	public dataSource: MatTableDataSource<DatedAthleteSettingsTableModel>;

	@Output("datedAthleteSettingsModelsChange")
	public datedAthleteSettingsModelsChange: EventEmitter<void> = new EventEmitter<void>();

	constructor(public athleteService: AthleteService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		this.dataSource = new MatTableDataSource<DatedAthleteSettingsTableModel>();
		this.loadData();
	}

	private loadData(): void {

		this.athleteService.fetch().then((athleteModel: AthleteModel) => {

			this.datedAthleteSettingsModels = athleteModel.datedAthleteSettings;

			// Auto creates a dated athlete settings if no one exists
			if (this.datedAthleteSettingsModels.length === 0) {
				this.athleteService.addSettings(DatedAthleteSettingsModel.DEFAULT_MODEL).then(() => {
					this.datedAthleteSettingsModelsChange.emit();
					this.loadData();
				}, error => {
					this.handleErrors(error);
				});

			} else {
				this.dataSource.data = this.generateTableData(this.datedAthleteSettingsModels);
			}

		});
	}

	private generateTableData(datedAthleteSettingsModels: DatedAthleteSettingsModel[]): DatedAthleteSettingsTableModel[] {

		const datedAthleteSettingsTableModels: DatedAthleteSettingsTableModel[] = [];
		_.forEach(datedAthleteSettingsModels, (datedAthleteSettingsModel: DatedAthleteSettingsModel, index: number) => {
			const previousDatedAthleteSettingsModel = datedAthleteSettingsModels[index - 1];
			datedAthleteSettingsTableModels.push(new DatedAthleteSettingsTableModel(datedAthleteSettingsModel, previousDatedAthleteSettingsModel));
		});
		return datedAthleteSettingsTableModels;
	}

	public onAdd(): void {

		const datedAthleteSettingsModelBase = _.cloneDeep(_.first(this.datedAthleteSettingsModels));

		datedAthleteSettingsModelBase.since = DatedAthleteSettingsModel.DEFAULT_SINCE;

		const datedAthleteSettingsDialogData: DatedAthleteSettingsDialogData = {
			action: DatedAthleteSettingsAction.ACTION_ADD,
			datedAthleteSettingsModel: datedAthleteSettingsModelBase
		};

		const dialogRef = this.dialog.open(EditDatedAthleteSettingsDialogComponent, {
			width: EditDatedAthleteSettingsDialogComponent.WIDTH,
			data: datedAthleteSettingsDialogData
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((datedAthleteSettingsModel: DatedAthleteSettingsModel) => {

			if (datedAthleteSettingsModel) {
				this.athleteService.addSettings(datedAthleteSettingsModel).then(() => {
					this.datedAthleteSettingsModelsChange.emit();
					this.loadData();
				}, error => {
					this.handleErrors(error);
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	public onEdit(sinceIdentifier: string): void {

		const datedAthleteSettingsModelToEdit = _.find(this.datedAthleteSettingsModels, {since: sinceIdentifier});

		const datedAthleteSettingsDialogData: DatedAthleteSettingsDialogData = {
			action: DatedAthleteSettingsAction.ACTION_EDIT,
			datedAthleteSettingsModel: datedAthleteSettingsModelToEdit
		};

		const dialogRef = this.dialog.open(EditDatedAthleteSettingsDialogComponent, {
			width: EditDatedAthleteSettingsDialogComponent.WIDTH,
			data: datedAthleteSettingsDialogData
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((datedAthleteSettingsModel: DatedAthleteSettingsModel) => {

			if (datedAthleteSettingsModel) {
				this.athleteService.editSettings(sinceIdentifier, datedAthleteSettingsModel).then(() => {
					this.datedAthleteSettingsModelsChange.emit();
					this.loadData();
				}, error => {
					this.handleErrors(error);
				});
			}

			afterClosedSubscription.unsubscribe();
		});

	}

	public onRemove(sinceIdentifier: string): void {

		const confirmDialogDataModel = new ConfirmDialogDataModel(null, "Are you sure to remove this dated athlete settings?");

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			data: confirmDialogDataModel
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (confirmed) {
				this.athleteService.removeSettings(sinceIdentifier).then(() => {
					this.datedAthleteSettingsModelsChange.emit();
					this.loadData();
				}, error => {
					this.handleErrors(error);
				});

			}
			afterClosedSubscription.unsubscribe();
		});
	}

	public onReset(): void {

		const data: ConfirmDialogDataModel = {
			title: "Reset your dated athlete settings",
			content: "Are you sure to perform this action? Current settings will be lost."
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {

				this.athleteService.resetSettings().then(() => {
					this.datedAthleteSettingsModelsChange.emit();
					this.loadData();
				}, error => {
					this.handleErrors(error);
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	private handleErrors(error: any) {

		this.logger.error(error);

		if (error instanceof AppError) {
			const message = (<AppError>error).message;
			this.snackBar.open(message, "Close");
		}

	}
}
