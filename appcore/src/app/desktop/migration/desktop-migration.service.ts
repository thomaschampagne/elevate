import { Inject, Injectable } from "@angular/core";
import { VERSIONS_PROVIDER } from "../../shared/services/versions/versions-provider.interface";
import * as semver from "semver";
import { DesktopVersionsProvider } from "../../shared/services/versions/impl/desktop-versions-provider.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

@Injectable()
export class DesktopMigrationService {

    constructor(@Inject(VERSIONS_PROVIDER) public desktopVersionsProvider: DesktopVersionsProvider,
                public dialog: MatDialog,
                public logger: LoggerService) {
    }

    /**
     * Perform required upgrades to a newly version installed.
     * Do nothing if no new versions.
     */
    public upgrade(): Promise<void> {

        return this.detectUpgrade().then((upgradeData: { fromVersion: string, toVersion: string }) => {
            if (upgradeData) {
                return this.applyUpgrades(upgradeData.fromVersion, upgradeData.toVersion);
            }
            return Promise.resolve();
        }).then(() => {
            return this.trackPackageVersion();
        }).catch(err => {
            if (err.reason && err.reason === "DOWNGRADE") {
                this.dialog.open(GotItDialogComponent, {
                    data: <GotItDialogDataModel> {
                        content: err.message
                    }
                });
                return this.trackPackageVersion();
            }
            return Promise.reject(err);
        });
    }

    public detectUpgrade(): Promise<{ fromVersion: string, toVersion: string }> {

        return Promise.all([
            this.desktopVersionsProvider.getSavedVersion(),
            this.desktopVersionsProvider.getPackageVersion()
        ]).then((results: string[]) => {

            const savedVersion = results[0];
            const packageVersion = results[1];

            if (!savedVersion) {
                this.logger.info(`First install detected.`);
                return Promise.resolve(null);
            }

            if (semver.eq(savedVersion, packageVersion)) {
                return Promise.resolve(null);
            }

            if (semver.eq(savedVersion, packageVersion)) {
                return Promise.resolve({fromVersion: savedVersion, toVersion: packageVersion});
            }

            if (semver.lt(savedVersion, packageVersion)) {
                return Promise.resolve({fromVersion: savedVersion, toVersion: packageVersion});
            }

            if (semver.gt(savedVersion, packageVersion)) {
                const errorMessage = `Downgrade detected from ${savedVersion} to ${packageVersion}. You might encounter some issues. Consider uninstall this version and reinstall latest version to avoid issues.`;
                return Promise.reject({reason: "DOWNGRADE", message: errorMessage});
            }

            return Promise.reject(`Upgrade detection error with savedVersion: ${savedVersion}; packageVersion: ${packageVersion}`);
        });
    }

    /**
     * Stores the package version into local storage to detect any upgrades with upper versions.
     */
    public trackPackageVersion(): Promise<void> {
        return this.desktopVersionsProvider.getPackageVersion().then(packageVersion => {
            localStorage.setItem(DesktopVersionsProvider.DESKTOP_SAVED_VERSION_KEY, packageVersion);
            return Promise.resolve();
        });
    }

    private applyUpgrades(fromVersion: string, toVersion: string): Promise<void> {

        this.logger.info(`Applying upgrade(s) from ${fromVersion} to ${toVersion}`);

        // Create upgrade methods here...
        // ...
        // ...

        return Promise.resolve();
    }
}
