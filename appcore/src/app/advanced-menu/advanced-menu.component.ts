import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { SyncService } from "../shared/services/sync/sync.service";

@Component({ template: "" })
export abstract class AdvancedMenuComponent implements OnInit {
  protected constructor(
    @Inject(SyncService) protected readonly syncService: SyncService<any>,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {}

  public ngOnInit(): void {}

  public abstract onZoneSettingsReset(): void;

  public onWipeActivities(): void {
    const data: ConfirmDialogDataModel = {
      title: "Wipe synced activities",
      content: "It will remove all your synced activities. Are you sure to perform this action?"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.syncService.clearActivities().then(
          () => {
            afterClosedSubscription.unsubscribe();
            location.reload();
          },
          error => {
            this.snackBar.open(error, "Close");
          }
        );
      }
    });
  }
}
