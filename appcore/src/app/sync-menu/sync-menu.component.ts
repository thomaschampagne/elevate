import { Component, InjectionToken, OnDestroy, OnInit } from "@angular/core";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { SyncService } from "../shared/services/sync/sync.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { ElevateException } from "@elevate/shared/exceptions";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { ImportExportProgressDialogComponent } from "../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { Subscription } from "rxjs";
import { AppService } from "../shared/services/app-service/app.service";
import { SyncMenuAction } from "./sync-menu-action.model";

export const SYNC_MENU_COMPONENT = new InjectionToken<SyncMenuComponent>("SYNC_MENU_COMPONENT");

@Component({ template: "" })
export abstract class SyncMenuComponent implements OnInit, OnDestroy {
  public SyncState = SyncState;
  public syncState: SyncState;
  public syncMenuActions: SyncMenuAction[];
  public historyChangesSub: Subscription;

  protected abstract readonly backupDoneMessage;

  protected constructor(
    public readonly appService: AppService,
    protected readonly router: Router,
    protected readonly syncService: SyncService<any>,
    protected readonly dialog: MatDialog,
    protected readonly snackBar: MatSnackBar
  ) {
    this.syncState = null;
  }

  protected abstract updateSyncStatus(): void;

  protected updateSyncMenu(): void {
    this.syncMenuActions = [];
  }

  public ngOnInit(): void {
    this.updateSyncStatus();
    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.updateSyncStatus();
    });
  }

  public onSyncedBackupImport(): void {
    throw new ElevateException("onSyncedBackupImport must be implemented in a child class");
  }

  public onSync(fastSync: boolean = null, forceSync: boolean = null): void {}

  public onClearSyncedData(): void {
    const data: ConfirmDialogDataModel = {
      title: "Clear your athlete synced data",
      content:
        "Are you sure to perform this action? You will be able to re-import synced data through backup file " +
        "or a new re-synchronization."
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.syncService.clearSyncedActivities().then(
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

  public onSyncedBackupExport(): void {
    const progressDialogRef = this.dialog.open(ImportExportProgressDialogComponent, {
      disableClose: true,
      data: ImportExportProgressDialogComponent.MODE_EXPORT
    });

    progressDialogRef
      .afterOpened()
      .toPromise()
      .then(() => {
        this.syncService.export().then(
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

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }
}
