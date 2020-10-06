import { ErrorHandler, Inject, Injectable } from "@angular/core";
import { LoggerService } from "./shared/services/logging/logger.service";
import { MatDialog } from "@angular/material/dialog";
import * as Sentry from "@sentry/browser";
import { environment } from "../environments/environment";
import { EnvTarget } from "@elevate/shared/models";
import { ConfirmDialogComponent } from "./shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "./shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { VERSIONS_PROVIDER, VersionsProvider } from "./shared/services/versions/versions-provider.interface";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElevateException, SyncException } from "@elevate/shared/exceptions";
import { GotItDialogComponent } from "./shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "./shared/dialogs/got-it-dialog/got-it-dialog-data.model";

@Injectable({
  providedIn: "root",
})
export class ElevateErrorHandler implements ErrorHandler {
  private static readonly SENTRY_DATA_SOURCE_NAME: string =
    "https://884e69ce1f2c4891abbaca363d8474ce@sentry.io/1839710";

  constructor(
    @Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public loggerService: LoggerService
  ) {
    if (environment.target === EnvTarget.DESKTOP) {
      this.versionsProvider.getPackageVersion().then(version => {
        Sentry.init({
          dsn: ElevateErrorHandler.SENTRY_DATA_SOURCE_NAME,
          release: version,
          environment: environment.production ? "production" : "development",
        });
      });
    }
  }

  private static provideErrorIfPromiseRejection(error: PromiseRejectionEvent | any): Error {
    if (error.promise && error.promise) {
      error = error.rejection;
    }
    return error;
  }

  private static captureSentryEventId(error: any) {
    return Sentry.captureException(error.originalError || error);
  }

  public handleError(error: Error): void {
    error = ElevateErrorHandler.provideErrorIfPromiseRejection(error);

    this.loggerService.error(error);

    if (error) {
      let errorMessage: string;

      if (error instanceof ElevateException) {
        if (error instanceof SyncException) {
          errorMessage = "Sync error";
        } else {
          errorMessage = "Elevate error";
        }

        errorMessage += ": " + error.message;
      } else {
        errorMessage = error.message;
      }

      if (environment.target === EnvTarget.DESKTOP) {
        if (environment.production) {
          // Sentry error tracking
          const sentryEventId = ElevateErrorHandler.captureSentryEventId(error);
          this.snackBar
            .open(errorMessage, "Report")
            .onAction()
            .subscribe(() => {
              Sentry.showReportDialog({
                eventId: sentryEventId,
                title: "Submitting this crash report is important!",
                subtitle: "Please paste any files shared links in description which might help to fix the error.",
                subtitle2: "",
                labelEmail: "Your email (it will not be shared)",
                labelComments:
                  "Please give all steps to reproduce the error + files shared links (like Google Drive, Dropbox, OneDrive, Mediafire, Mega, ...) if you can. Thanks for your help!!",
              });
            });
        } else {
          this.snackBar
            .open(errorMessage, "View")
            .onAction()
            .subscribe(() => {
              this.dialog.open(GotItDialogComponent, {
                data: {
                  title: `${errorMessage}. Press CTRL+F12 for details`,
                  content: `<pre>${error.stack}</pre>`,
                } as GotItDialogDataModel,
              });
            });
        }
      } else if (environment.target === EnvTarget.EXTENSION) {
        this.snackBar
          .open(errorMessage, "Show")
          .onAction()
          .subscribe(() => {
            const content = "<pre>" + error.stack.toString() + "</pre>";
            this.dialog.open(ConfirmDialogComponent, {
              minWidth: ConfirmDialogComponent.MAX_WIDTH,
              maxWidth: ConfirmDialogComponent.MAX_WIDTH,
              data: new ConfirmDialogDataModel(errorMessage, content, "Report what happened", "Close"),
            });
          });
      }
    } else {
      alert(
        "Unknown error occurred: \n\n" +
          JSON.stringify(error) +
          "\n\n\n\n(Press 'F12' or 'CTRL+F12' to get more details in console)"
      );
    }
  }
}
