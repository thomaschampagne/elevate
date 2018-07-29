import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatPaginator, MatSnackBar, MatSort, MatTableDataSource } from "@angular/material";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { PeriodicAthleteSettingsService } from "../../../shared/services/periodic-athlete-settings/periodic-athlete-settings.service";
import { EditPeriodicAthleteSettingsDialogComponent } from "../edit-periodic-athlete-settings-dialog/edit-periodic-athlete-settings-dialog.component";
import * as _ from "lodash";
import { PeriodicAthleteSettingsTableModel } from "./models/periodic-athlete-settings-table.model";
import { PeriodicAthleteSettingsAction } from "../edit-periodic-athlete-settings-dialog/periodic-athlete-settings-action.enum";
import { PeriodicAthleteSettingsDialogData } from "../edit-periodic-athlete-settings-dialog/periodic-athlete-settings-dialog-data.model";
import { ConfirmDialogComponent } from "../../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { AppError } from "../../../shared/models/app-error.model";

@Component({
	selector: "app-periodic-athlete-settings-manager",
	templateUrl: "./periodic-athlete-settings-manager.component.html",
	styleUrls: ["./periodic-athlete-settings-manager.component.scss"]
})
export class PeriodicAthleteSettingsManagerComponent implements OnInit {

	public readonly displayedColumns: string[] = ["from", "to", "weight", "maxHr", "restHr", "lthr.default", "lthr.cycling", "lthr.running", "cyclingFtp", "runningFtp", "swimFtp", "edit", "delete"]; // TODO !!

	@ViewChild(MatPaginator)
	public matPaginator: MatPaginator;

	@ViewChild(MatSort)
	public matSort: MatSort;

	public periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[];

	public dataSource: MatTableDataSource<PeriodicAthleteSettingsTableModel>;

	constructor(public athletePeriodicSettingsService: PeriodicAthleteSettingsService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
		this.dataSource = new MatTableDataSource<PeriodicAthleteSettingsTableModel>();
		this.updateTable();
	}

	private updateTable(): void {
		this.athletePeriodicSettingsService.fetch().then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {
			this.periodicAthleteSettingsModels = periodicAthleteSettingsModels;
			this.dataSource.data = this.generateTableData(periodicAthleteSettingsModels);
		});
	}

	private generateTableData(periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]): PeriodicAthleteSettingsTableModel[] {

		const periodicAthleteSettingsTableModels: PeriodicAthleteSettingsTableModel[] = [];
		_.forEach(periodicAthleteSettingsModels, (periodicAthleteSettingsModel: PeriodicAthleteSettingsModel, index: number) => {
			const previousPeriodicAthleteSettingsModel = periodicAthleteSettingsModels[index - 1];
			periodicAthleteSettingsTableModels.push(new PeriodicAthleteSettingsTableModel(periodicAthleteSettingsModel, previousPeriodicAthleteSettingsModel));
		});
		return periodicAthleteSettingsTableModels;
	}

	public onAdd(): void {

		const periodicAthleteSettingsDialogData: PeriodicAthleteSettingsDialogData = {
			action: PeriodicAthleteSettingsAction.ACTION_ADD
		};
		const dialogRef = this.dialog.open(EditPeriodicAthleteSettingsDialogComponent, {
			data: periodicAthleteSettingsDialogData

		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((periodicAthleteSettingsModel: PeriodicAthleteSettingsModel) => {

			if (periodicAthleteSettingsModel) {
				this.athletePeriodicSettingsService.add(periodicAthleteSettingsModel).then(() => {
					this.updateTable();
				}, error => {
					this.handleErrors(error);
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	public onEdit(fromIdentifier: string): void {

		const periodicAthleteSettingsModelToEdit = _.find(this.periodicAthleteSettingsModels, {from: fromIdentifier});

		const periodicAthleteSettingsDialogData: PeriodicAthleteSettingsDialogData = {
			action: PeriodicAthleteSettingsAction.ACTION_EDIT,
			periodicAthleteSettingsModel: periodicAthleteSettingsModelToEdit
		};

		const dialogRef = this.dialog.open(EditPeriodicAthleteSettingsDialogComponent, {
			data: periodicAthleteSettingsDialogData
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((periodicAthleteSettingsModel: PeriodicAthleteSettingsModel) => {

			if (periodicAthleteSettingsModel) {
				this.athletePeriodicSettingsService.edit(fromIdentifier, periodicAthleteSettingsModel).then(() => {
					this.updateTable();
				}, error => {
					this.handleErrors(error);
				});
			}

			afterClosedSubscription.unsubscribe();
		});

	}

	public onRemove(fromIdentifier: string): void {

		const confirmDialogDataModel = new ConfirmDialogDataModel(null, "Are you sure to remove this periodic athlete settings?");

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			data: confirmDialogDataModel
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (confirmed) {
				this.athletePeriodicSettingsService.remove(fromIdentifier).then(() => {
					afterClosedSubscription.unsubscribe();
					this.updateTable();

				}, error => {
					this.handleErrors(error);
				});

			} else {
				afterClosedSubscription.unsubscribe();
			}
		});
	}

	private handleErrors(error: any) {

		console.error(error);

		if (error instanceof AppError) {
			const message = (<AppError> error).message;
			this.snackBar.open(message, "Close");
		}

	}
}
