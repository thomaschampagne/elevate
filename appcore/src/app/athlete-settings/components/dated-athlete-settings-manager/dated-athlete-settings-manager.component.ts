import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
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
import { ClipboardService, IClipboardResponse } from "ngx-clipboard";

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

    public showExport: boolean;
    public showImport: boolean;
    public exportedSettings: string;

    @Output()
    public datedAthleteSettingsModelsChange: EventEmitter<void> = new EventEmitter<void>();


    constructor(private athleteService: AthleteService,
                private clipboardService: ClipboardService,
                private dialog: MatDialog,
                private snackBar: MatSnackBar,
                private logger: LoggerService) {
    }

    public ngOnInit(): void {
        this.dataSource = new MatTableDataSource<DatedAthleteSettingsTableModel>();
        this.hideExportImportForm();
        this.loadData();
    }

    public onAdd(): void {

        const datedAthleteSettingsModelBase: DatedAthleteSettingsModel = _.cloneDeep(_.first(this.datedAthleteSettingsModels));

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

        const datedAthleteSettingsModelToEdit: DatedAthleteSettingsModel = _.find<DatedAthleteSettingsModel>(this.datedAthleteSettingsModels, {since: sinceIdentifier});

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

    private loadData(): void {

        this.hideExportImportForm();

        this.athleteService.fetch().then((athleteModel: AthleteModel) => {

            this.datedAthleteSettingsModels = athleteModel.datedAthleteSettings;

            // Auto creates a dated athlete settings if no one exists
            if (this.datedAthleteSettingsModels.length === 0) {
                this.athleteService.resetSettings().then(() => {
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

    private handleErrors(error: any) {

        this.logger.error(error);

        if (error instanceof AppError) {
            const message = (<AppError> error).message;
            this.snackBar.open(message, "Close");
        }

    }

    public onShowExport(): void {
        this.showExport = true;
        this.showImport = !this.showExport;
        this.exportedSettings = btoa(JSON.stringify(this.datedAthleteSettingsModels));
    }

    public onShowImport(): void {
        this.showImport = true;
        this.showExport = !this.showImport;
    }

    public onImport(inlineSettings: string = null): void {

        const promiseSettings = inlineSettings ? Promise.resolve(inlineSettings) : navigator.clipboard.readText();

        promiseSettings.then(settings => {
            try {

                let datedAthleteSettingsModels: DatedAthleteSettingsModel[];
                try {
                    const decodedSettings = atob(settings);
                    datedAthleteSettingsModels = JSON.parse(decodedSettings);
                } catch (e) {
                    throw new Error("Data provided is corrupted");
                }

                // Check import consistency
                this.assertSettingsValid(datedAthleteSettingsModels);

                // Persist new settings
                this.athleteService.fetch().then((athleteModel: AthleteModel) => {

                    athleteModel.datedAthleteSettings = datedAthleteSettingsModels;
                    return this.athleteService.save(athleteModel);

                }).then(() => {

                    this.snackBar.open("New settings imported", null, {duration: 2000});

                    // Hide import input
                    this.showImport = false;

                    this.datedAthleteSettingsModelsChange.emit();
                    this.loadData();

                }).catch(err => {
                    this.snackBar.open(err, "Close", {duration: 4000});
                });

            } catch (err) {
                this.snackBar.open(err, "Close", {duration: 4000});
                this.logger.error(err);
            }

        });

    }

    public assertSettingsValid(datedAthleteSettingsModels: DatedAthleteSettingsModel[]): void {

        if (!_.isArray(datedAthleteSettingsModels)) {
            this.logger.error("Dated athlete settings model provided should be an array");
            throw new Error("Invalid dated athlete settings set.");
        }

        datedAthleteSettingsModels.forEach((datedAthleteSettingsModel: DatedAthleteSettingsModel, index: number) => {

            if (datedAthleteSettingsModel.since !== null && !_.isString(datedAthleteSettingsModel.since)) {
                throw new Error("Invalid since date detected");
            }

            if (!datedAthleteSettingsModel.weight) {
                throw new Error("Invalid weight detected");
            }

            if (!datedAthleteSettingsModel.maxHr) {
                throw new Error("Invalid maxHr detected");
            }

            if (!datedAthleteSettingsModel.restHr) {
                throw new Error("Invalid restHr detected");
            }

            if (!datedAthleteSettingsModel.lthr) {

                throw new Error("Missing LTHR property detected");

            } else {

                if (datedAthleteSettingsModel.lthr.default !== null && !_.isNumber(datedAthleteSettingsModel.lthr.default)) {
                    throw new Error("Missing LTHR default detected");
                }

                if (datedAthleteSettingsModel.lthr.cycling !== null && !_.isNumber(datedAthleteSettingsModel.lthr.cycling)) {
                    throw new Error("Missing LTHR cycling detected");
                }

                if (datedAthleteSettingsModel.lthr.running !== null && !_.isNumber(datedAthleteSettingsModel.lthr.running)) {
                    throw new Error("Missing LTHR running detected");
                }
            }

            if (datedAthleteSettingsModel.cyclingFtp !== null && !_.isNumber(datedAthleteSettingsModel.cyclingFtp)) {
                throw new Error("Missing cycling FTP detected");
            }

            if (datedAthleteSettingsModel.runningFtp !== null && !_.isNumber(datedAthleteSettingsModel.runningFtp)) {
                throw new Error("Missing running FTP detected");
            }

            if (datedAthleteSettingsModel.swimFtp !== null && !_.isNumber(datedAthleteSettingsModel.swimFtp)) {
                throw new Error("Missing swim FTP detected");
            }
        });
    }

    public onSettingsClipBoardSaved($event: IClipboardResponse): void {
        if ($event.isSuccess) {
            this.snackBar.open(`Settings copied to clipboard.`, null, {duration: 1000});
        }
    }

    private hideExportImportForm(): void {
        this.showExport = false;
        this.showImport = false;
        this.exportedSettings = null;
    }
}
