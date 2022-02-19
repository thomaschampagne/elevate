import { Inject, Injectable } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { VersionsProvider } from "../../shared/services/versions/versions-provider";
import { AppLoadService } from "../app-load.service";
import { DesktopMigrationService, UpgradeResult } from "../../desktop/migration/desktop-migration.service";
import { DataStore } from "../../shared/data-store/data-store";
import { FileConnectorInfoService } from "../../shared/services/file-connector-info/file-connector-info.service";
import { DesktopUpdateService } from "../../desktop/app-update/desktop-update.service";
import { MachineService } from "../../desktop/machine/machine.service";
import { AppRoutes } from "../../shared/models/app-routes";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { sleep } from "@elevate/shared/tools/sleep";

@Injectable()
export class DesktopLoadService extends AppLoadService {
  public static readonly CHECK_IN_FREQUENCY = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(DataStore) protected readonly dataStore: DataStore<object>,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(DesktopUpdateService) private readonly desktopUpdateService: DesktopUpdateService,
    @Inject(DesktopMigrationService) private readonly desktopMigrationService: DesktopMigrationService,
    @Inject(FileConnectorInfoService) private readonly fsConnectorInfoService: FileConnectorInfoService,
    @Inject(MachineService) private readonly machineService: MachineService,
    @Inject(Router) private readonly router: Router,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService
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
          return this.fsConnectorInfoService.ensureSourceDirectoryCompliance();
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

          // Perform checkin at end of executions
          sleep().then(() => {
            // Check-in now
            this.machineService.checkIn();

            // And do it every X minutes
            setInterval(() => this.machineService.checkIn(), DesktopLoadService.CHECK_IN_FREQUENCY);
          });
        });
    });
  }
}
