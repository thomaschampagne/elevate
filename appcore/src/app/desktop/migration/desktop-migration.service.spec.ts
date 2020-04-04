import { TestBed } from "@angular/core/testing";

import { DesktopMigrationService } from "./desktop-migration.service";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { DesktopVersionsProvider } from "../../shared/services/versions/impl/desktop-versions-provider.service";

describe("DesktopMigrationService", () => {

    let service: DesktopMigrationService;
    beforeEach(done => {

        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                SharedModule,
                DesktopModule
            ]
        });

        service = TestBed.inject(DesktopMigrationService);
        done();
    });

    it("should detect upgrade", done => {

        // Given
        const packageVersion = "7.1.0";
        const savedVersion = "7.0.0";
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        spyOn(service.desktopVersionsProvider, "getSavedVersion").and.returnValue(Promise.resolve(savedVersion));

        // When
        const promise = service.detectUpgrade();

        // Then
        promise.then((upgradeData: { fromVersion: string, toVersion: string }) => {
            expect(upgradeData).not.toBeNull();
            expect(upgradeData.fromVersion).toBe(savedVersion);
            expect(upgradeData.toVersion).toBe(packageVersion);
            done();
        }, () => {
            throw new Error("Should not be here");
        });
    });

    it("should not detect upgrade when saved & package version are same", done => {

        // Given
        const packageVersion = "7.0.0";
        const savedVersion = "7.0.0";
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        spyOn(service.desktopVersionsProvider, "getSavedVersion").and.returnValue(Promise.resolve(savedVersion));

        // When
        const promise = service.detectUpgrade();

        // Then
        promise.then((upgrade: { fromVersion: string, toVersion: string }) => {
            expect(upgrade).toBeNull();
            done();
        }, () => {
            throw new Error("Should not be here");
        });
    });

    it("should not detect upgrade when no saved version", done => {

        // Given
        const packageVersion = "7.0.0";
        const savedVersion = "7.0.0";
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        spyOn(service.desktopVersionsProvider, "getSavedVersion").and.returnValue(Promise.resolve(savedVersion));

        // When
        const promise = service.detectUpgrade();

        // Then
        promise.then((upgradeData: { fromVersion: string, toVersion: string }) => {
            expect(upgradeData).toBeNull();
            done();
        }, () => {
            throw new Error("Should not be here");
        });
    });

    it("should detect downgrade", done => {

        // Given
        const packageVersion = "6.0.0";
        const savedVersion = "7.0.0";
        const errorMessage = `Downgrade detected from ${savedVersion} to ${packageVersion}. You might encounter some issues. Consider uninstall this version and reinstall latest version to avoid issues.`;
        const expectedError = {reason: "DOWNGRADE", message: errorMessage};
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        spyOn(service.desktopVersionsProvider, "getSavedVersion").and.returnValue(Promise.resolve(savedVersion));

        // When
        const promise = service.detectUpgrade();

        // Then
        promise.then(() => {
            throw new Error("Should not be here");
        }, err => {
            expect(err).not.toBeNull();
            expect(err).toEqual(expectedError);
            done();
        });
    });

    it("should trigger upgrade", done => {

        // Given
        const packageVersion = "7.1.0";
        const savedVersion = "7.0.0";
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        spyOn(service.desktopVersionsProvider, "getSavedVersion").and.returnValue(Promise.resolve(savedVersion));
        const detectUpgradeSpy = spyOn(service, "detectUpgrade").and.callThrough();
        const flagMigratedVersion = spyOn(service, "trackPackageVersion").and.callThrough();

        // When
        const promise = service.upgrade();

        // Then
        promise.then(() => {
            expect(detectUpgradeSpy).toHaveBeenCalledTimes(1);
            expect(flagMigratedVersion).toHaveBeenCalledTimes(1);
            done();
        }, () => {
            throw new Error("Should not be here");
        });
    });

    it("should track package version from newly migrated version", done => {

        // Given
        const packageVersion = "7.1.0";
        spyOn(service.desktopVersionsProvider, "getPackageVersion").and.returnValue(Promise.resolve(packageVersion));
        const setItemSpy = spyOn(localStorage, "setItem").and.stub();

        // When
        const promise = service.trackPackageVersion();

        // Then
        promise.then(() => {
            expect(setItemSpy).toHaveBeenCalledWith(DesktopVersionsProvider.DESKTOP_SAVED_VERSION_KEY, packageVersion);
            done();
        }, () => {
            throw new Error("Should not be here");
        });
    });

});
