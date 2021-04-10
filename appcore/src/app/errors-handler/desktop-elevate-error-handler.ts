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
    @Inject(AppService) protected readonly desktopAppService: DesktopAppService
  ) {
    super(versionsProvider, dialog, snackBar, loggerService);

    Sentry.init({
      dsn: DesktopElevateErrorHandler.SENTRY_DATA_SOURCE_NAME,
      release: this.versionsProvider.getPackageVersion(),
      environment: environment.production ? "production" : "development",
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

  public onErrorHandled(error: Error): void {
    Sentry.captureException((error as any).originalError || error);
  }
}
