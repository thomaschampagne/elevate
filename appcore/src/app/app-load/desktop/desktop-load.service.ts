import { Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { HttpClient } from "@angular/common/http";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { VersionsProvider } from "../../shared/services/versions/versions-provider";
import { AppLoadService } from "../app-load.service";
import { DesktopMigrationService, UpgradeResult } from "../../desktop/migration/desktop-migration.service";
import { DataStore } from "../../shared/data-store/data-store";
import { DesktopInsightsService } from "../../desktop/insights/desktop-insights.service";
import { Insights } from "../../desktop/insights/insights.model";
import { FileConnectorInfoService } from "../../shared/services/file-connector-info/file-connector-info.service";
import { DesktopUpdateService } from "../../desktop/app-update/desktop-update.service";
import { AppService } from "../../shared/services/app-service/app.service";
import { DesktopAppService } from "../../shared/services/app-service/desktop/desktop-app.service";
import { AppRoutes } from "../../shared/models/app-routes";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";

@Injectable()
export class DesktopLoadService extends AppLoadService {
  constructor(
    @Inject(DataStore) protected readonly dataStore: DataStore<object>,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(AppService) public readonly desktopAppService: DesktopAppService,
    @Inject(HttpClient) private readonly httpClient: HttpClient,
    @Inject(StravaConnectorInfoService) private readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(DesktopUpdateService) private readonly desktopUpdateService: DesktopUpdateService,
    @Inject(DesktopMigrationService) private readonly desktopMigrationService: DesktopMigrationService,
    @Inject(FileConnectorInfoService) private readonly fsConnectorInfoService: FileConnectorInfoService,
    @Inject(Router) private readonly router: Router,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(DesktopInsightsService) private readonly insightsService: DesktopInsightsService
  ) {
    super(dataStore);
  }

  public loadApp(): Promise<void> {
    return super.loadApp().then(() => {
      let upgradeResult: UpgradeResult;
      return this.desktopMigrationService
        .upgrade()
        .then(migrationUpgradeResult => {
          upgradeResult = migrationUpgradeResult;
          return this.desktopUpdateService.handleUpdate();
        })
        .then(() => {
          return Promise.all([this.desktopAppService.getRuntimeInfo(), this.stravaConnectorInfoService.fetch()])
            .then(results => {
              const runtimeInfo = results[0] as RuntimeInfo;
              const stravaConnectorInfo = results[1] as StravaConnectorInfo;

              console.warn("REMOVE_ME", runtimeInfo, stravaConnectorInfo);

              // Register machine for insights
              // TODO Append athlete model or last athlete model snapshot
              // TODO Machine should not be in "Insights" namespace. It's not a namespace...
              const machine = new Insights.Machine(
                runtimeInfo.machineId,
                this.versionsProvider.getPackageVersion(),
                runtimeInfo,
                stravaConnectorInfo.stravaAccount
              );
              this.insightsService.registerMachine(machine);

              // Make sure local file connector source directory exists
              return this.fsConnectorInfoService.ensureSourceDirectoryCompliance();
            })
            .catch(error => {
              this.logger.error(error);
              return Promise.reject(error);
            });
        })
        .then(() => {
          // Check if a version has been installed. If so show release note popup
          if (upgradeResult.toVersion) {
            this.versionsProvider.notifyInstalledVersion(upgradeResult.toVersion);
          }

          if (upgradeResult.firstInstall) {
            this.dialog
              .open(GotItDialogComponent, {
                minWidth: GotItDialogComponent.MIN_WIDTH,
                maxWidth: GotItDialogComponent.MAX_WIDTH,
                data: new GotItDialogDataModel(
                  "First install detected: please configure your athlete settings",
                  "It's the first time Elevate is started. Please configure your athlete settings before syncing any connectors.",
                  "Let's configure my athlete settings"
                ),
                disableClose: true
              })
              .afterClosed()
              .toPromise()
              .then(() => this.router.navigate([AppRoutes.athleteSettings]));
          }
        });
    });
  }
}
