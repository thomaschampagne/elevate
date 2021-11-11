import { Inject, Injectable, Injector } from "@angular/core";
import semver from "semver";
import { DesktopVersionsProvider } from "../../shared/services/versions/impl/desktop-versions-provider.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { DataStore } from "../../shared/data-store/data-store";
import { VersionsProvider } from "../../shared/services/versions/versions-provider";
import { DesktopMigration } from "./desktop-migrations.model";
import { DesktopRegisteredMigrations } from "./desktop-registered-migrations";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { DesktopActivityService } from "../../shared/services/activity/impl/desktop-activity.service";
import { IpcStorageService } from "../ipc/ipc-storage.service";

export interface UpgradeResult {
  toVersion: string;
  firstInstall: boolean;
}

@Injectable()
export class DesktopMigrationService {
  constructor(
    @Inject(Injector) public readonly injector: Injector,
    @Inject(VersionsProvider) public readonly versionsProvider: DesktopVersionsProvider,
    @Inject(IpcStorageService) public readonly ipcStorageService: IpcStorageService,
    @Inject(DataStore) public readonly dataStore: DataStore<object>,
    @Inject(ActivityService) public readonly activityService: DesktopActivityService,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.db = this.dataStore.db;
  }

  public static readonly IPC_STORAGE_RECALCULATE_REQUESTED_BY_PATH: string = "recalculateRequestedBy";
  private readonly db: LokiConstructor;

  /**
   * Perform required upgrades to a newly version installed.
   * Do nothing if no new versions.
   * @return Promise of upgraded version or null if no upgrade
   */
  public upgrade(): Promise<UpgradeResult> {
    const upgradeResult: UpgradeResult = { toVersion: null, firstInstall: false };
    return this.detectUpgrade()
      .then((upgradeData: { fromVersion: string; toVersion: string }) => {
        if (upgradeData) {
          this.logger.info(`Upgrade to ${upgradeData.toVersion} detected.`);
          return this.applyUpgrades(upgradeData.fromVersion, upgradeData.toVersion)
            .then(() => {
              return this.dataStore.persist(true);
            })
            .then(() => {
              this.logger.info(`Upgrade to ${upgradeData.toVersion} done.`);
              upgradeResult.toVersion = upgradeData.toVersion;
              return Promise.resolve(upgradeResult);
            });
        } else {
          this.logger.debug("No upgrade detected");
          // Check if first install...
          return this.versionsProvider.getExistingVersion().then(existingVersion => {
            if (!existingVersion) {
              this.logger.info(`First install detected.`);
              upgradeResult.firstInstall = true;
            }
            return Promise.resolve(upgradeResult);
          });
        }
      })
      .then(() => {
        return this.trackPackageVersion().then(() => Promise.resolve(upgradeResult));
      })
      .catch(err => {
        if (err.reason && err.reason === "DOWNGRADE") {
          this.dialog.open(GotItDialogComponent, {
            data: {
              content: err.message
            } as GotItDialogDataModel
          });
          return this.trackPackageVersion().then(() => Promise.resolve(upgradeResult));
        }
        return Promise.reject(err);
      });
  }

  public detectUpgrade(): Promise<{ fromVersion: string; toVersion: string }> {
    return Promise.all([this.versionsProvider.getExistingVersion(), this.versionsProvider.getPackageVersion()]).then(
      (results: string[]) => {
        const existingVersion = results[0];
        const packageVersion = results[1];

        if (!existingVersion) {
          return Promise.resolve(null);
        }

        if (semver.eq(existingVersion, packageVersion)) {
          return Promise.resolve(null);
        }

        if (semver.eq(existingVersion, packageVersion)) {
          return Promise.resolve({ fromVersion: existingVersion, toVersion: packageVersion });
        }

        if (semver.lt(existingVersion, packageVersion)) {
          return Promise.resolve({ fromVersion: existingVersion, toVersion: packageVersion });
        }

        if (semver.gt(existingVersion, packageVersion)) {
          const errorMessage = `Downgrade detected from ${existingVersion} to ${packageVersion}. You might encounter some issues. Consider uninstall this version and reinstall latest version to avoid issues.`;
          return Promise.reject({ reason: "DOWNGRADE", message: errorMessage });
        }

        return Promise.reject(
          `Upgrade detection error with existing version: ${existingVersion}; packageVersion: ${packageVersion}`
        );
      }
    );
  }

  /**
   * Stores the package version into local storage to detect any upgrades with upper versions.
   */
  public trackPackageVersion(): Promise<void> {
    const packageVersion = this.versionsProvider.getPackageVersion();
    this.logger.debug(`Tracking package version ${packageVersion}`);
    return this.versionsProvider.setExistingVersion(packageVersion);
  }

  public applyUpgrades(fromVersion: string, toVersion: string): Promise<void> {
    this.logger.info(`Applying upgrade(s) from ${fromVersion} to ${toVersion}`);

    let upgradeRequiresRecalculationByVersion: string = null;

    return this.getDesktopRegisteredMigrations()
      .reduce((previousMigrationDone: Promise<void>, migration: DesktopMigration) => {
        return previousMigrationDone.then(() => {
          if (semver.lt(fromVersion, migration.version)) {
            this.logger.info(`Migrating to ${migration.version}: ${migration.description}`);
            return migration.upgrade(this.db, this.injector).then(() => {
              // Check if migration requires a recalculation
              if (migration.requiresRecalculation) {
                upgradeRequiresRecalculationByVersion = migration.version;
              }
              return Promise.resolve();
            });
          }
          return Promise.resolve();
        });
      }, Promise.resolve())
      .then(() => {
        // Flag required recalculation if any migration played ask for it and current app has activities
        if (upgradeRequiresRecalculationByVersion) {
          return this.activityService.count().then(count => {
            if (count > 0) {
              return this.flagRequiresActivitiesRecalculationByVersion(upgradeRequiresRecalculationByVersion);
            }
            return Promise.resolve();
          });
        }
        return Promise.resolve();
      });
  }

  public getDesktopRegisteredMigrations(): DesktopMigration[] {
    return DesktopRegisteredMigrations.LIST;
  }

  public recalculateRequestedBy(): Promise<string> {
    return this.ipcStorageService.get<string>(DesktopMigrationService.IPC_STORAGE_RECALCULATE_REQUESTED_BY_PATH);
  }

  public clearRequiredRecalculation(): Promise<void> {
    return this.ipcStorageService.rm<string>(DesktopMigrationService.IPC_STORAGE_RECALCULATE_REQUESTED_BY_PATH);
  }

  public flagRequiresActivitiesRecalculationByVersion(version: string): Promise<void> {
    return this.ipcStorageService.set<string>(
      DesktopMigrationService.IPC_STORAGE_RECALCULATE_REQUESTED_BY_PATH,
      version
    );
  }
}
