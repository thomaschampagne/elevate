import { ErrorHandler, Inject } from "@angular/core";
import { LoggerService } from "../shared/services/logging/logger.service";
import { MatDialog } from "@angular/material/dialog";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElevateException, SyncException, WarningException } from "@elevate/shared/exceptions";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

export abstract class ElevateErrorHandler implements ErrorHandler {
  protected constructor(
    @Inject(VersionsProvider) protected readonly versionsProvider: VersionsProvider,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) protected readonly loggerService: LoggerService
  ) {}

  private static provideErrorIfPromiseRejection(error: PromiseRejectionEvent | any): Error {
    if (error.promise && error.promise) {
      error = error.rejection;
    }
    return error;
  }

  abstract onErrorHandled(error: Error);

  public handleError(error: Error): void {
    error = ElevateErrorHandler.provideErrorIfPromiseRejection(error);

    this.loggerService.error(error);

    if (error) {
      let errorMessage: string;

      if (typeof error === "string") {
        error = new Error(error);
      }

      if (error instanceof ElevateException) {
        if (error instanceof WarningException) {
          const warningException = error as WarningException;
          this.snackBar
            .open(
              warningException.message,
              warningException.actionName || "Ok",
              warningException.duration ? { duration: warningException.duration } : {}
            )
            .onAction()
            .toPromise()
            .then(() => {
              if (warningException.onAction) {
                warningException.onAction();
              }
            });
          return;
        }

        if (error instanceof SyncException) {
          errorMessage = "Sync error";
        } else {
          errorMessage = "Elevate error";
        }

        errorMessage += ": " + error.message;
      } else {
        errorMessage = error.message;
      }

      // Show action see the error
      this.displayViewErrorAction(errorMessage, error);

      this.onErrorHandled(error);
    } else {
      alert(
        "Unknown error occurred.\n\nCan you screenshot this and report a bug?\n\nThanks!\n\n" + error.stack.toString()
      );
    }
  }

  private displayViewErrorAction(errorMessage: string, error: Error): void {
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
