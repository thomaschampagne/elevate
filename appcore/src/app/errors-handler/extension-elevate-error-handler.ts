import { ElevateErrorHandler } from "./elevate-error-handler";
import { Inject, Injectable } from "@angular/core";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggerService } from "../shared/services/logging/logger.service";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

@Injectable({
  providedIn: "root"
})
export class ExtensionElevateErrorHandler extends ElevateErrorHandler {
  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(MatDialog) public readonly dialog: MatDialog,
    @Inject(MatSnackBar) public readonly snackBar: MatSnackBar,
    @Inject(LoggerService) public readonly loggerService: LoggerService
  ) {
    super(versionsProvider, dialog, snackBar, loggerService);
  }

  public onErrorHandled(error: Error): void {}

  public displayViewErrorAction(errorMessage: string, error: Error): void {
    this.snackBar
      .open(errorMessage, "View")
      .onAction()
      .toPromise()
      .then(() => {
        this.dialog.open(GotItDialogComponent, {
          data: {
            title: `${errorMessage}.`,
            content: `<pre class="mat-caption">${error.stack}</pre>`
          } as GotItDialogDataModel
        });
      });
  }
}
