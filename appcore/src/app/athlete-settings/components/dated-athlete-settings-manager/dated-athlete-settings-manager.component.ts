import { Component, EventEmitter, Inject, OnInit, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import { AthleteService } from "../../../shared/services/athlete/athlete.service";
import { EditDatedAthleteSettingsDialogComponent } from "../edit-dated-athlete-settings-dialog/edit-dated-athlete-settings-dialog.component";
import _ from "lodash";
import { DatedAthleteSettingsTable } from "./models/dated-athlete-settings-table.model";
import { DatedAthleteSettingsAction } from "../edit-dated-athlete-settings-dialog/dated-athlete-settings-action.enum";
import { DatedAthleteSettingsDialogData } from "../edit-dated-athlete-settings-dialog/dated-athlete-settings-dialog-data.model";
import { ConfirmDialogComponent } from "../../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { AppError } from "../../../shared/models/app-error.model";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { ClipboardService, IClipboardResponse } from "ngx-clipboard";
import { AppService } from "../../../shared/services/app-service/app.service";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";

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

  public datedAthleteSettings: DatedAthleteSettings[];

  public dataSource: MatTableDataSource<DatedAthleteSettingsTable>;

  public showExport: boolean;
  public showImport: boolean;
  public exportedSettings: string;

  @Output()
  public datedAthleteSettingsChange: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(AthleteService) private readonly athleteService: AthleteService,
    @Inject(ClipboardService) private readonly clipboardService: ClipboardService,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.dataSource = new MatTableDataSource<DatedAthleteSettingsTable>();
    this.hideExportImportForm();
    this.loadData();
  }

  public onAdd(): void {
    const datedAthleteSettingsBase: DatedAthleteSettings = _.cloneDeep(_.first(this.datedAthleteSettings));

    datedAthleteSettingsBase.since = DatedAthleteSettings.DEFAULT_SINCE;

    const datedAthleteSettingsDialogData: DatedAthleteSettingsDialogData = {
      action: DatedAthleteSettingsAction.ACTION_ADD,
      datedAthleteSettings: datedAthleteSettingsBase
    };

    const dialogRef = this.dialog.open(EditDatedAthleteSettingsDialogComponent, {
      width: EditDatedAthleteSettingsDialogComponent.WIDTH,
      data: datedAthleteSettingsDialogData
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((datedAthleteSettings: DatedAthleteSettings) => {
      if (datedAthleteSettings) {
        this.athleteService.addSettings(datedAthleteSettings).then(
          () => {
            this.datedAthleteSettingsChange.emit();
            this.loadData();
          },
          error => {
            this.handleErrors(error);
          }
        );
      }

      afterClosedSubscription.unsubscribe();
    });
  }

  public onEdit(sinceIdentifier: string): void {
    const datedAthleteSettingsToEdit: DatedAthleteSettings = _.find<DatedAthleteSettings>(this.datedAthleteSettings, {
      since: sinceIdentifier
    });

    const datedAthleteSettingsDialogData: DatedAthleteSettingsDialogData = {
      action: DatedAthleteSettingsAction.ACTION_EDIT,
      datedAthleteSettings: datedAthleteSettingsToEdit
    };

    const dialogRef = this.dialog.open(EditDatedAthleteSettingsDialogComponent, {
      width: EditDatedAthleteSettingsDialogComponent.WIDTH,
      data: datedAthleteSettingsDialogData
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((datedAthleteSettings: DatedAthleteSettings) => {
      if (datedAthleteSettings) {
        this.athleteService.editSettings(sinceIdentifier, datedAthleteSettings).then(
          () => {
            this.datedAthleteSettingsChange.emit();
            this.loadData();
          },
          error => {
            this.handleErrors(error);
          }
        );
      }

      afterClosedSubscription.unsubscribe();
    });
  }

  public onRemove(sinceIdentifier: string): void {
    const confirmDialogDataModel = new ConfirmDialogDataModel(
      null,
      "Are you sure to remove this dated athlete settings?"
    );

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: confirmDialogDataModel
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.athleteService.removeSettings(sinceIdentifier).then(
          () => {
            this.datedAthleteSettingsChange.emit();
            this.loadData();
          },
          error => {
            this.handleErrors(error);
          }
        );
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
        this.athleteService.resetSettings().then(
          () => {
            this.datedAthleteSettingsChange.emit();
            this.loadData();
          },
          error => {
            this.handleErrors(error);
          }
        );
      }

      afterClosedSubscription.unsubscribe();
    });
  }

  public onShowExport(): void {
    this.showExport = true;
    this.showImport = !this.showExport;
    this.exportedSettings = btoa(JSON.stringify(this.datedAthleteSettings));
  }

  public onShowImport(): void {
    this.showImport = true;
    this.showExport = !this.showImport;
  }

  public onImport(inlineSettings: string = null): void {
    const promiseSettings = inlineSettings ? Promise.resolve(inlineSettings) : navigator.clipboard.readText();

    promiseSettings.then(settings => {
      try {
        let datedAthleteSettings: DatedAthleteSettings[];
        try {
          const decodedSettings = atob(settings);
          datedAthleteSettings = JSON.parse(decodedSettings);
        } catch (e) {
          throw new Error("Data provided is corrupted");
        }

        // Check import consistency
        this.assertSettingsValid(datedAthleteSettings);

        // Persist new settings
        this.athleteService
          .fetch()
          .then((athleteModel: AthleteModel) => {
            athleteModel.datedAthleteSettings = datedAthleteSettings;
            return this.athleteService.validateUpdate(athleteModel);
          })
          .then(() => {
            this.snackBar.open("New settings imported", "Close", { duration: 3000 });

            // Hide import input
            this.showImport = false;

            this.datedAthleteSettingsChange.emit();
            this.loadData();
          })
          .catch(err => {
            this.snackBar.open(err, "Close", { duration: 4000 });
          });
      } catch (err) {
        this.snackBar.open(err, "Close", { duration: 4000 });
        this.logger.error(err);
      }
    });
  }

  public assertSettingsValid(datedAthleteSettings: DatedAthleteSettings[]): void {
    if (!_.isArray(datedAthleteSettings)) {
      this.logger.error("Dated athlete settings model provided should be an array");
      throw new Error("Invalid dated athlete settings set.");
    }

    datedAthleteSettings.forEach((datedAthleteSettings: DatedAthleteSettings, index: number) => {
      if (datedAthleteSettings.since !== null && !_.isString(datedAthleteSettings.since)) {
        throw new Error("Invalid since date detected");
      }

      if (!datedAthleteSettings.weight) {
        throw new Error("Invalid weight detected");
      }

      if (!datedAthleteSettings.maxHr) {
        throw new Error("Invalid maxHr detected");
      }

      if (!datedAthleteSettings.restHr) {
        throw new Error("Invalid restHr detected");
      }

      if (!datedAthleteSettings.lthr) {
        throw new Error("Missing LTHR property detected");
      } else {
        if (datedAthleteSettings.lthr.default !== null && !_.isNumber(datedAthleteSettings.lthr.default)) {
          throw new Error("Missing LTHR default detected");
        }

        if (datedAthleteSettings.lthr.cycling !== null && !_.isNumber(datedAthleteSettings.lthr.cycling)) {
          throw new Error("Missing LTHR cycling detected");
        }

        if (datedAthleteSettings.lthr.running !== null && !_.isNumber(datedAthleteSettings.lthr.running)) {
          throw new Error("Missing LTHR running detected");
        }
      }

      if (datedAthleteSettings.cyclingFtp !== null && !_.isNumber(datedAthleteSettings.cyclingFtp)) {
        throw new Error("Missing cycling FTP detected");
      }

      if (datedAthleteSettings.runningFtp !== null && !_.isNumber(datedAthleteSettings.runningFtp)) {
        throw new Error("Missing running FTP detected");
      }

      if (datedAthleteSettings.swimFtp !== null && !_.isNumber(datedAthleteSettings.swimFtp)) {
        throw new Error("Missing swim FTP detected");
      }
    });
  }

  public onSettingsClipBoardSaved($event: IClipboardResponse): void {
    if ($event.isSuccess) {
      this.snackBar.open(`Settings copied to clipboard.`, "Close", { duration: 3000 });
    }
  }

  public getOsCopyShortCut(): string {
    return (navigator.platform.match(/^mac/gi) ? "Command" : "Ctrl") + " + C";
  }

  public getOsPasteShortCut(): string {
    return (navigator.platform.match(/^mac/gi) ? "Command" : "Ctrl") + " + V";
  }

  private loadData(): void {
    this.hideExportImportForm();

    this.athleteService.fetch().then((athleteModel: AthleteModel) => {
      this.datedAthleteSettings = athleteModel.datedAthleteSettings;

      // Auto creates a dated athlete settings if no one exists
      if (this.datedAthleteSettings.length === 0) {
        this.athleteService.resetSettings().then(
          () => {
            this.datedAthleteSettingsChange.emit();
            this.loadData();
          },
          error => {
            this.handleErrors(error);
          }
        );
      } else {
        this.dataSource.data = this.generateTableData(this.datedAthleteSettings);
      }
    });
  }

  private generateTableData(datedAthleteSettings: DatedAthleteSettings[]): DatedAthleteSettingsTable[] {
    const datedAthleteSettingsTableModels: DatedAthleteSettingsTable[] = [];
    _.forEach(datedAthleteSettings, (settings: DatedAthleteSettings, index: number) => {
      const previousDatedAthleteSettings = datedAthleteSettings[index - 1];
      datedAthleteSettingsTableModels.push(new DatedAthleteSettingsTable(settings, previousDatedAthleteSettings));
    });
    return datedAthleteSettingsTableModels;
  }

  private handleErrors(error: any): void {
    this.logger.error(error);

    if (error instanceof AppError) {
      const message = (error as AppError).message;
      this.snackBar.open(message, "Close");
    }
  }

  private hideExportImportForm(): void {
    this.showExport = false;
    this.showImport = false;
    this.exportedSettings = null;
  }
}
