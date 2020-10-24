import { Component, Inject, InjectionToken, OnDestroy, OnInit } from "@angular/core";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { SyncService } from "../shared/services/sync/sync.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { ElevateException } from "@elevate/shared/exceptions";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { ImportExportProgressDialogComponent } from "../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { Subscription } from "rxjs";

export const SYNC_MENU_COMPONENT = new InjectionToken<SyncMenuComponent>("SYNC_MENU_COMPONENT");

@Component({ template: "" })
export abstract class SyncMenuComponent implements OnInit, OnDestroy {
  private static readonly UPDATE_SYNC_DATE_STATUS_EVERY: number = 1000 * 60;
  public SyncState = SyncState;
  public syncState: SyncState;
  public syncDateMessage: string;
  public syncDoneSub: Subscription;

  protected constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(SyncService) protected readonly syncService: SyncService<any>,
    @Inject(AppEventsService) protected readonly appEventsService: AppEventsService,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {
    this.syncState = null;
    this.syncDateMessage = null;
  }

  public ngOnInit(): void {
    // Update sync status in toolbar and Refresh SyncDate displayed every minutes
    this.updateSyncDateStatus();
    setInterval(() => {
      this.updateSyncDateStatus();
    }, SyncMenuComponent.UPDATE_SYNC_DATE_STATUS_EVERY);

    this.syncDoneSub = this.appEventsService.syncDone$.subscribe(() => {
      this.updateSyncDateStatus();
    });
  }

  public updateSyncDateStatus(): void {
    throw new ElevateException("updateSyncDateStatus must be implemented in a child class");
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
      .then(result => {
        this.dialog.open(GotItDialogComponent, {
          minWidth: GotItDialogComponent.MIN_WIDTH,
          maxWidth: GotItDialogComponent.MAX_WIDTH,
          data: new GotItDialogDataModel(null, 'File "' + result.filename + '" is ready to be saved.')
        });
      });
  }

  public ngOnDestroy(): void {
    this.syncDoneSub.unsubscribe();
  }
}
