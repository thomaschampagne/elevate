import { ErrorHandler, Inject, Injectable } from "@angular/core";
import { LoggerService } from "./shared/services/logging/logger.service";
import { MatDialog, MatSnackBar } from "@angular/material";
import * as Sentry from "@sentry/browser";
import { environment } from "../environments/environment";
import { EnvTarget } from "@elevate/shared/models";
import { ConfirmDialogComponent } from "./shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "./shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { VERSIONS_PROVIDER, VersionsProvider } from "./shared/services/versions/versions-provider.interface";

@Injectable()
export class ElevateErrorHandler implements ErrorHandler {

	private static readonly SENTRY_DATA_SOURCE_NAME: string = "https://884e69ce1f2c4891abbaca363d8474ce@sentry.io/1839710";

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public loggerService: LoggerService) {

		if (environment.target === EnvTarget.DESKTOP) {
			this.versionsProvider.getInstalledAppVersion().then(version => {
				Sentry.init({
					dsn: ElevateErrorHandler.SENTRY_DATA_SOURCE_NAME,
					release: version,
					environment: (environment.production) ? "production" : "development"
				});
			});
		}

	}

	public handleError(error: Error): void {

		// TODO Tmp fix Promise rejection wrapped by zone.js
		// TODO @see https://stackoverflow.com/questions/51951471/angular-custom-error-handler-not-getting-error-type-from-promise
		if ((<any> error).promise && (<any> error).rejection) {
			error = (<any> error).rejection;
		}

		this.loggerService.error(error);

		if (error.name) {

			const message = "Whoops: " + error.message;

			if (environment.target === EnvTarget.DESKTOP) {

				// Sentry error tracking
				const sentryEventId = Sentry.captureException((<any> error).originalError || error);

				this.snackBar.open(message, "Report error").onAction().subscribe(() => {
					Sentry.showReportDialog({
						eventId: sentryEventId,
						title: "Please tell what happened steps by steps below.",
						subtitle: "To view error in app console press 'CTRL+F12'.",
						subtitle2: "",
					});
				});

			} else if (environment.target === EnvTarget.EXTENSION) {

				this.snackBar.open(message, "Show").onAction().subscribe(() => {
					const content = "<pre>" + error.stack.toString() + "</pre>";
					this.dialog.open(ConfirmDialogComponent, {
						minWidth: ConfirmDialogComponent.MAX_WIDTH,
						maxWidth: ConfirmDialogComponent.MAX_WIDTH,
						data: new ConfirmDialogDataModel(message, content, "Report what happened", "Close")
					});
				});

			}

		} else {
			alert("Unknown error occurred: \n\n" + JSON.stringify(error) + "\n\n\n\n(Press 'F12' or 'CTRL+F12' to get more details in console)");
		}
	}
}
