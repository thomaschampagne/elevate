import { ErrorHandler, Inject, Injectable } from "@angular/core";
import { LoggerService } from "./shared/services/logging/logger.service";
import { MatDialog } from "@angular/material/dialog";
import * as Sentry from "@sentry/browser";
import { environment } from "../environments/environment";
import { BuildTarget } from "@elevate/shared/enums";
import { VersionsProvider } from "./shared/services/versions/versions-provider";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElevateException, SyncException, WarningException } from "@elevate/shared/exceptions";
import { GotItDialogComponent } from "./shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "./shared/dialogs/got-it-dialog/got-it-dialog-data.model";

@Injectable({
  providedIn: "root"
})
export class ElevateErrorHandler implements ErrorHandler {
  private static readonly SENTRY_DATA_SOURCE_NAME: string =
    "https://884e69ce1f2c4891abbaca363d8474ce@sentry.io/1839710";

  constructor(
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly loggerService: LoggerService
  ) {
    if (environment.buildTarget === BuildTarget.DESKTOP) {
      Sentry.init({
        dsn: ElevateErrorHandler.SENTRY_DATA_SOURCE_NAME,
        release: this.versionsProvider.getPackageVersion(),
        environment: environment.production ? "production" : "development"
      });
    }
  }

  private static provideErrorIfPromiseRejection(error: PromiseRejectionEvent | any): Error {
    if (error.promise && error.promise) {
      error = error.rejection;
    }
    return error;
  }

  private static sendErrorToSentry(error: any): void {
    Sentry.captureException(error.originalError || error);
  }

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

      if (environment.buildTarget === BuildTarget.DESKTOP && environment.production) {
        ElevateErrorHandler.sendErrorToSentry(error);
      }
      // Show action see the error
      this.displayViewErrorAction(errorMessage, error);
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
