import { Component, Inject, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { ExtensionSyncService } from "../../shared/services/sync/impl/extension-sync.service";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { AppRoutes } from "../../shared/models/app-routes";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AppService } from "../../shared/services/app-service/app.service";
import { ExtensionAppService } from "../../shared/services/app-service/extension/extension-app.service";
import { ExtensionImportBackupDialogComponent } from "../../shared/dialogs/backups/extension/extension-import-backup-dialog.component";
import { ExtensionDumpModel } from "../../shared/models/extension-dump.model";

@Component({
  selector: "app-extension-sync-menu",
  template: `
    <div *ngIf="syncState !== null">
      <div class="dual-split-button">
        <button
          mat-button
          [disabled]="extensionAppService.isSyncing"
          color="primary"
          (click)="syncMenuActions[0].action()"
          matTooltip="{{ syncMenuActions[0]?.tooltip }}"
        >
          <mat-icon fontSet="material-icons-outlined">{{ syncMenuActions[0].icon }}</mat-icon>
          {{ syncMenuActions[0].text }}
        </button>
        <button
          mat-icon-button
          color="primary"
          [disabled]="extensionAppService.isSyncing"
          [matMenuTriggerFor]="syncMenu"
        >
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
  styleUrls: ["./extension-sync-menu.component.scss"]
})
export class ExtensionSyncMenuComponent extends SyncMenuComponent implements OnInit {
  protected readonly backupDoneMessage = "Profile backup has been saved in downloads";

  constructor(
    @Inject(AppService) public readonly extensionAppService: ExtensionAppService,
    @Inject(Router) protected readonly router: Router,
    @Inject(SyncService) protected readonly extensionSyncService: ExtensionSyncService,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {
    super(extensionAppService, router, extensionSyncService, dialog, snackBar);
  }

  public ngOnInit(): void {
    super.ngOnInit();
  }

  protected updateSyncMenu(): void {
    super.updateSyncMenu();

    if (this.syncState === SyncState.SYNCED) {
      this.syncMenuActions.push({
        icon: "update",
        text: "Sync new activities",
        action: () => this.onSync(true, false)
      });

      this.syncMenuActions.push({
        icon: "sync",
        text: "Sync all activities",
        action: () => this.onSync(false, false)
      });
    }

    if (this.syncState === SyncState.PARTIALLY_SYNCED) {
      this.syncMenuActions.push({
        icon: "sync_problem",
        text: "Continue sync",
        tooltip: "Warning: Sync isn't finished. Click to continue.",
        action: () => this.onSync(false, false)
      });
    }

    if (this.syncState === SyncState.PARTIALLY_SYNCED || this.syncState === SyncState.SYNCED) {
      this.syncMenuActions.push({
        icon: "redo",
        text: "Clear and re-sync activities",
        action: () => this.onSync(false, true)
      });

      this.syncMenuActions.push({
        icon: "clear",
        text: "Clear synced activities",
        action: () => this.onClearSyncedData()
      });
    }

    if (this.syncState === SyncState.NOT_SYNCED) {
      this.syncMenuActions.push({
        icon: "sync_disabled",
        text: "Sync your activities",
        action: () => this.onSync(false, false)
      });
    }

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
    this.extensionSyncService.getSyncState().then((syncState: SyncState) => {
      this.syncState = syncState;
      this.updateSyncMenu();
    });
  }

  public onBackup(): void {
    const progressDialogRef = this.dialog.open(ExtensionImportBackupDialogComponent, {
      disableClose: true,
      data: ExtensionImportBackupDialogComponent.MODE_EXPORT
    });

    progressDialogRef
      .afterOpened()
      .toPromise()
      .then(() => {
        this.extensionSyncService.backup().then(
          result => {
            progressDialogRef.close(result);
          },
          error => {
            this.snackBar.open(error, "Close");
          }
        );
      });

    progressDialogRef
      .afterClosed()
      .toPromise()
      .then(() => {
        this.snackBar.open(this.backupDoneMessage, "Ok", { duration: 15000 });
      });
  }

  public onRestore(): void {
    const dialogRef = this.dialog.open(ExtensionImportBackupDialogComponent, {
      minWidth: ExtensionImportBackupDialogComponent.MIN_WIDTH,
      maxWidth: ExtensionImportBackupDialogComponent.MAX_WIDTH
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((dumpModel: ExtensionDumpModel) => {
      if (dumpModel) {
        this.extensionSyncService.restore(dumpModel).then(
          () => {
            location.reload();
          },
          error => {
            this.snackBar.open(error, "Close");
          }
        );
      }

      afterClosedSubscription.unsubscribe();
    });
  }

  public onSync(fastSync: boolean, forceSync: boolean): void {
    if (this.syncState === SyncState.NOT_SYNCED) {
      const data: ConfirmDialogDataModel = {
        title: "⚠️ First synchronisation",
        content:
          "Your first synchronisation can take a long time and can be done in several times " +
          "if you have more than 400 activities. Make sure you properly setup your " +
          "athlete settings before (Cycling FTP, Running FTP, Swim FTP, Heart rate, ...) or may have missing results in " +
          "Elevate features. This is to avoid a redo of the first synchronisation.",
        confirmText: "Start sync",
        cancelText: "Check my athlete settings"
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        minWidth: ConfirmDialogComponent.MIN_WIDTH,
        maxWidth: "50%",
        data: data
      });

      const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
        if (confirm) {
          this.extensionSyncService.sync(fastSync, forceSync);
        } else {
          this.router.navigate([AppRoutes.athleteSettings]);
        }
        afterClosedSubscription.unsubscribe();
      });
    } else {
      this.extensionSyncService.sync(fastSync, forceSync);
    }
  }
}
