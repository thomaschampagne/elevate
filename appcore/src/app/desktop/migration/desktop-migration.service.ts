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

@Injectable()
export class DesktopMigrationService {
  constructor(
    @Inject(Injector) public readonly injector: Injector,
    @Inject(VersionsProvider) public readonly versionsProvider: DesktopVersionsProvider,
    @Inject(DataStore) public readonly dataStore: DataStore<object>,
    @Inject(ActivityService) public readonly activityService: DesktopActivityService,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.db = this.dataStore.db;
  }

  public static readonly RECALCULATE_REQUIRED_LS_KEY: string = "recalculateRequiredByVersion";
  private readonly db: LokiConstructor;

  /**
   * Perform required upgrades to a newly version installed.
   * Do nothing if no new versions.
   * @return Promise of upgraded version or null if no upgrade
   */
  public upgrade(): Promise<string> {
    let hasBeenUpgradedToVersion = null;
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
              hasBeenUpgradedToVersion = upgradeData.toVersion;
              return Promise.resolve();
            });
        } else {
          this.logger.debug("No upgrade detected");
        }

        return Promise.resolve();
      })
      .then(() => {
        return this.trackPackageVersion();
      })
      .then(() => {
        return Promise.resolve(hasBeenUpgradedToVersion);
      })
      .catch(err => {
        if (err.reason && err.reason === "DOWNGRADE") {
          this.dialog.open(GotItDialogComponent, {
            data: {
              content: err.message
            } as GotItDialogDataModel
          });
          return this.trackPackageVersion();
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
          this.logger.info(`First install detected.`);
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
              this.flagRequiresActivitiesRecalculationByVersion(upgradeRequiresRecalculationByVersion);
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

  public recalculateRequiredByVersion(): string {
    return localStorage.getItem(DesktopMigrationService.RECALCULATE_REQUIRED_LS_KEY);
  }

  public clearRequiredRecalculation(): void {
    return localStorage.removeItem(DesktopMigrationService.RECALCULATE_REQUIRED_LS_KEY);
  }

  public flagRequiresActivitiesRecalculationByVersion(version: string): void {
    localStorage.setItem(DesktopMigrationService.RECALCULATE_REQUIRED_LS_KEY, version);
  }
}
