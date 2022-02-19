import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import moment from "moment";
import { saveAs } from "file-saver";
import { LoggerService } from "../shared/services/logging/logger.service";
import { MatTableDataSource } from "@angular/material/table";
import { OPEN_RESOURCE_RESOLVER } from "../shared/services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../shared/services/links-opener/impl/desktop-open-resource-resolver.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { Activity, ActivityExtras } from "@elevate/shared/models/sync/activity.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";

export interface DisplayWarning {
  connectorType: ConnectorType;
  stack: string;
  code: string;
  description: string;
  details: string;
  activityDate?: Date;
  extras?: ActivityExtras;
}

@Component({
  selector: "app-desktop-errors-sync-details-dialog",
  template: `
    <h2 mat-dialog-title>
      {{ displayWarnings.length }} sync warning{{ displayWarnings.length > 1 ? "s" : "" }} occurred
    </h2>
    <mat-dialog-content class="mat-body-1">
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let error">{{ error.description }}</td>
        </ng-container>

        <ng-container matColumnDef="cause">
          <th mat-header-cell *matHeaderCellDef>Cause</th>
          <td mat-cell *matCellDef="let error">{{ error.details }}</td>
        </ng-container>

        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Code</th>
          <td mat-cell *matCellDef="let error">{{ error.code }}</td>
        </ng-container>

        <ng-container matColumnDef="activityDate">
          <th mat-header-cell *matHeaderCellDef>Activity Date</th>
          <td mat-cell *matCellDef="let error">
            <span *ngIf="error.activityDate">{{ error.activityDate | date: "medium" }}</span>
            <span *ngIf="!error.activityDate">-</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="view">
          <th mat-header-cell *matHeaderCellDef>Open</th>
          <td mat-cell *matCellDef="let error">
            <div *ngIf="error.extras">
              <button (click)="onOpenExtras(error.extras)" mat-icon-button matTooltip="Try to open activity">
                <mat-icon fontSet="material-icons-outlined" color="primary">visibility</mat-icon>
              </button>
            </div>
            <div *ngIf="!error.extras">-</div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-flat-button color="primary" (click)="exportToFile()">Export to file</button>
      <button mat-stroked-button mat-dialog-close color="primary">Ok</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        overflow: auto;
      }

      table {
        width: 100%;
      }
    `
  ]
})
export class DesktopErrorsSyncDetailsDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "90%";
  public static readonly MIN_WIDTH: string = "80%";

  public readonly displayedColumns: string[] = ["description", "cause", "activityDate", "code", "view"];

  public displayWarnings: DisplayWarning[];

  public dataSource: MatTableDataSource<DisplayWarning>;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly eventErrors: ErrorSyncEvent[],
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: DesktopOpenResourceResolver,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.logger.error("SYNC ERRORS", this.eventErrors);

    this.dataSource = new MatTableDataSource<DisplayWarning>();

    this.displayWarnings = this.eventErrors.map(err => {
      return {
        code: err.code,
        description: err.description,
        connectorType: err.fromConnectorType,
        details: err.details,
        stack: err.stack,
        activityDate: err.activity?.startTime ? new Date(err.activity.startTime) : null,
        extras: (err.activity as Activity)?.extras ? (err.activity as Activity).extras : null
      };
    });

    this.dataSource.data = this.displayWarnings;
  }

  public exportToFile(): void {
    const blob = new Blob([JSON.stringify(this.eventErrors, null, 2)], { type: "application/json; charset=utf-8" });
    const filename = "desktop_sync_warnings_" + moment().format("Y.M.D-H.mm.ss") + ".json";
    saveAs(blob, filename);
  }

  public onOpenExtras(extras: ActivityExtras): void {
    if (extras?.file?.path) {
      this.openResourceResolver.showItemInFolder(extras.file.path).catch(error => {
        this.snackBar.open(`Unable to locate "${extras.file.path}" file.`, "Close");
        this.logger.error(error);
      });
    }

    if (extras?.strava?.activityId) {
      this.openResourceResolver.openStravaActivity(extras.strava.activityId).catch(error => {
        this.snackBar.open(`Unable to open Strava activity id: "${extras.strava.activityId}"`, "Close");
        this.logger.error(error);
      });
    }
  }
}
