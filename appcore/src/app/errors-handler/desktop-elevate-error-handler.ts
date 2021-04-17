import { ElevateErrorHandler } from "./elevate-error-handler";
import { Inject, Injectable } from "@angular/core";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggerService } from "../shared/services/logging/logger.service";
import { AppService } from "../shared/services/app-service/app.service";
import { AthleteService } from "../shared/services/athlete/athlete.service";
import { DesktopAppService } from "../shared/services/app-service/desktop/desktop-app.service";
import * as Sentry from "@sentry/browser";
import { environment } from "../../environments/environment";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ElectronService } from "../desktop/electron/electron.service";

@Injectable({
  providedIn: "root"
})
export class DesktopElevateErrorHandler extends ElevateErrorHandler {
  private static readonly SENTRY_DATA_SOURCE_NAME: string =
    "https://884e69ce1f2c4891abbaca363d8474ce@sentry.io/1839710";

  constructor(
    @Inject(VersionsProvider) protected readonly versionsProvider: VersionsProvider,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) protected readonly loggerService: LoggerService,
    @Inject(AthleteService) protected readonly athleteService: AthleteService,
    @Inject(AppService) protected readonly desktopAppService: DesktopAppService,
    @Inject(ElectronService) protected readonly electronService: ElectronService
  ) {
    super(versionsProvider, dialog, snackBar, loggerService);

    if (environment.production) {
      Sentry.init({
        dsn: DesktopElevateErrorHandler.SENTRY_DATA_SOURCE_NAME,
        release: this.versionsProvider.getPackageVersion(),
        environment: "production",
        autoSessionTracking: true
      });

      Promise.all([this.desktopAppService.getRuntimeInfo(), this.athleteService.fetch()]).then(results => {
        const [runtimeInfo, athlete] = results;

        Sentry.setContext("athlete", {
          gender: athlete.gender,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          practiceLevel: athlete.practiceLevel,
          machineId: runtimeInfo.athleteMachineId,
          osUsername: runtimeInfo.osUsername,
          osHostname: runtimeInfo.osHostname,
          cpu: runtimeInfo.cpu.name,
          memory: runtimeInfo.memorySizeGb
        });
      });
    }
  }

  public onErrorHandled(error: Error): void {
    if (environment.production) {
      Sentry.captureException((error as any).originalError || error);
    }
  }

  public displayViewErrorAction(errorMessage: string, error: Error): void {
    this.snackBar
      .open("An unhandled error occurred", "Help")
      .onAction()
      .toPromise()
      .then(() => {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: `Unhandled issue occurred: ${errorMessage}.`,
            content: `
                <div>
                  <strong>Unfortunatly Elevate experienced the below unhandled issue. <span class="warn-color">If error still blocks the application, you might reset the app using below "Reset app" button (your data will be wiped).</span></strong></br>
                </div>
                <div>
                  <pre class="mat-caption">${error.stack}</pre>
                </div>
            `,
            cancelText: "Forget",
            confirmText: "Reset app",
            confirmColor: "warn"
          } as ConfirmDialogDataModel
        });

        dialogRef
          .afterClosed()
          .toPromise()
          .then((confirm: boolean) => {
            if (confirm) {
              this.onFullAppReset();
            }
          });
      });
  }

  public onFullAppReset(): void {
    const data: ConfirmDialogDataModel = {
      title: "Full application reset",
      content: `This will erase everything to reach a "fresh install" state. Are you sure to perform this action?`,
      confirmColor: "warn"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.electronService.resetApp();
      }
    });
  }
}
