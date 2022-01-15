import { Component, Inject, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { AppRoutes } from "../../shared/models/app-routes";
import { ElectronService } from "../../desktop/electron/electron.service";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AppService } from "../../shared/services/app-service/app.service";
import { ConnectorService } from "../../connectors/connector.service";
import { DesktopActivityService } from "../../shared/services/activity/impl/desktop-activity.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { DesktopAppService } from "../../shared/services/app-service/desktop/desktop-app.service";
import { DesktopBackupDialogComponent } from "../../shared/dialogs/backups/desktop/desktop-backup-dialog.component";
import { DesktopRestoreDialogComponent } from "../../shared/dialogs/backups/desktop/desktop-restore-dialog.component";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync/connector-sync-date-time.model";
import { ElevateException } from "@elevate/shared/exceptions/elevate.exception";
import { DesktopManualActivityDialogComponent } from "../../desktop/manual-activity/desktop-manual-activity-dialog.component";

@Component({
  selector: "app-desktop-sync-menu",
  template: `
    <div *ngIf="syncState !== null">
      <div class="dual-split-button">
        <button
          mat-button
          [disabled]="desktopAppService.isSyncing"
          color="primary"
          (click)="syncMenuActions[0].action()"
          matTooltip="{{ syncMenuActions[0]?.tooltip }}"
        >
          <mat-icon fontSet="material-icons-outlined">{{ syncMenuActions[0].icon }}</mat-icon>
          {{ syncMenuActions[0].text }}
        </button>
        <button mat-icon-button color="primary" [disabled]="desktopAppService.isSyncing" [matMenuTriggerFor]="syncMenu">
          <mat-icon fontSet="material-icons-outlined">expand_more</mat-icon>
        </button>
      </div>
      <mat-menu #syncMenu="matMenu">
        <button *ngFor="let menuAction of syncMenuActions.slice(1)" mat-menu-item (click)="menuAction.action()">
          <mat-icon fontSet="material-icons-outlined">{{ menuAction.icon }}</mat-icon>
          {{ menuAction.text }}
        </button>
      </mat-menu>
    </div>
  `,
  styleUrls: ["./desktop-sync-menu.component.scss"]
})
export class DesktopSyncMenuComponent extends SyncMenuComponent implements OnInit {
  public mostRecentConnectorSyncedType: ConnectorType;

  constructor(
    @Inject(AppService) public readonly desktopAppService: DesktopAppService,
    @Inject(Router) protected readonly router: Router,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(ActivityService) public readonly desktopActivityService: DesktopActivityService
  ) {
    super(desktopAppService, router, desktopSyncService, dialog, snackBar);
    this.mostRecentConnectorSyncedType = null;
  }

  public ngOnInit(): void {
    super.ngOnInit();
  }

  protected updateSyncMenu(): void {
    super.updateSyncMenu();

    if (this.syncState === SyncState.SYNCED) {
      this.syncMenuActions.push({
        icon: "update",
        text: `Sync new ${ConnectorService.printType(this.mostRecentConnectorSyncedType)} activities`,
        action: () => this.onSync(true)
      });

      this.syncMenuActions.push({
        icon: "sync",
        text: `Sync all ${ConnectorService.printType(this.mostRecentConnectorSyncedType)} activities`,
        action: () => this.onSync(false)
      });
    }

    this.syncMenuActions.push({
      icon: this.syncState === SyncState.PARTIALLY_SYNCED ? "sync_problem" : "power",
      text: this.syncState === SyncState.SYNCED ? "Go to connectors" : "Sync with connectors",
      tooltip:
        this.syncState === SyncState.PARTIALLY_SYNCED
          ? "Warning: 1 connector must be synced completely. Click to configure connectors."
          : null,
      action: () => this.goToConnectors()
    });

    this.syncMenuActions.push({
      icon: "add",
      text: "Manual entry",
      action: () => this.onManualEntry()
    });

    this.syncMenuActions.push({
      icon: "vertical_align_bottom",
      text: "Backup profile",
      action: () => this.onBackup()
    });

    this.syncMenuActions.push({
      icon: "vertical_align_top",
      text: "Restore profile",
      action: () => this.onRestore()
    });
  }

  protected updateSyncStatus(): void {
    this.desktopSyncService.getSyncState().then((syncState: SyncState) => {
      this.syncState = syncState;
      if (this.syncState === SyncState.SYNCED) {
        this.desktopSyncService.getMostRecentSyncedConnector().then((connectorSyncDateTime: ConnectorSyncDateTime) => {
          if (connectorSyncDateTime) {
            this.mostRecentConnectorSyncedType = connectorSyncDateTime.connectorType;
          }
          this.updateSyncMenu();
        });
      } else {
        this.updateSyncMenu();
      }
    });
  }

  public onBackup(): void {
    const dialogRef = this.dialog.open(DesktopBackupDialogComponent, {
      minWidth: DesktopBackupDialogComponent.MIN_WIDTH,
      maxWidth: DesktopBackupDialogComponent.MAX_WIDTH,
      closeOnNavigation: false,
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(backupFilePath => {
        if (backupFilePath) {
          this.snackBar
            .open("Backup file ready", "Show in folder")
            .onAction()
            .toPromise()
            .then(() => {
              this.electronService.showItemInFolder(backupFilePath);
            });
        }
      });
  }

  public onRestore(): void {
    this.dialog.open(DesktopRestoreDialogComponent, {
      minWidth: DesktopRestoreDialogComponent.MIN_WIDTH,
      maxWidth: DesktopRestoreDialogComponent.MAX_WIDTH,
      closeOnNavigation: false,
      disableClose: true
    });
  }

  public onSync(fastSync: boolean = null, forceSync: boolean = null): void {
    this.onSyncMostRecentConnectorSynced(fastSync);
  }

  public onSyncMostRecentConnectorSynced(fastSync: boolean = null): void {
    if (this.mostRecentConnectorSyncedType) {
      this.desktopSyncService.sync(fastSync, null, this.mostRecentConnectorSyncedType);
    } else {
      throw new ElevateException("No recent connector synced found. Please sync a connector completely.");
    }
  }

  public goToConnectors(): void {
    if (this.router.isActive(AppRoutes.connectors, false)) {
      this.snackBar.open("You are already on connectors section 😉", "Ok", { duration: 4000 });
      return;
    }
    this.router.navigate([AppRoutes.connectors]);
  }

  private onManualEntry(): void {
    this.dialog.open(DesktopManualActivityDialogComponent, {
      minWidth: DesktopManualActivityDialogComponent.MIN_WIDTH,
      maxWidth: DesktopManualActivityDialogComponent.MAX_WIDTH
    });
  }
}
