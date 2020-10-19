import { TestBed } from "@angular/core/testing";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { of } from "rxjs";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { PropertiesModel } from "@elevate/shared/models";
import { Platform } from "@elevate/shared/enums";
import { DesktopVersionsProvider } from "./desktop-versions-provider.service";
import { GhAsset, GhRelease } from "../gh-release.model";
import _ from "lodash";
import { TargetModule } from "../../../modules/target/desktop-target.module";

describe("DesktopVersionsProvider", () => {
  let service: DesktopVersionsProvider;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [DesktopVersionsProvider, { provide: DataStore, useClass: TestingDataStore }]
    });

    // Retrieve injected preferencesService
    service = TestBed.inject(DesktopVersionsProvider);

    done();
  });

  it("should provide the existing version", done => {
    // Given
    const expectedVersion = "5.5.5";
    const propertiesModel = new PropertiesModel(expectedVersion);
    const propertyFindOneSpy = spyOn(service.propertiesDao, "findOne").and.returnValue(
      Promise.resolve(propertiesModel)
    );

    // When
    const promise = service.getExistingVersion();

    // Then
    promise.then(
      existingVersion => {
        expect(existingVersion).toEqual(expectedVersion);
        expect(propertyFindOneSpy).toHaveBeenCalledTimes(1);
        done();
      },
      () => {
        throw new Error("Should not be here");
      }
    );
  });

  describe("Provide remote versions by platforms", () => {
    it("should provide all desktop remote versions (windows)", done => {
      // Given
      const expectedVersionCount = 3;
      const platform = Platform.WINDOWS;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.6",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.5",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.4",
          draft: false,
          prerelease: false,
          assets: [{ name: "web_extension.zip" }] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.3",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getGithubReleasesByPlatform(platform);

      // Then
      promise.then(
        remoteVersions => {
          expect(remoteVersions.length).toEqual(expectedVersionCount);
          const missingVersion = _.find(remoteVersions, { tag_name: "7.0.4" });
          expect(missingVersion).toBeUndefined();
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should provide all webext remote versions w/ last version flagged as prerelease (prerelease allowed) and one as draft", done => {
      // Given
      const expectedVersionCount = 2;
      const platform = Platform.WEB_EXT;
      const acceptPreReleases = true;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.6",
          draft: false,
          prerelease: true,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.5",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.4",
          draft: true,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.3",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getGithubReleasesByPlatform(platform, acceptPreReleases);

      // Then
      promise.then(
        remoteVersions => {
          expect(remoteVersions.length).toEqual(expectedVersionCount);
          let missingVersion = _.find(remoteVersions, { tag_name: "7.0.5" });
          expect(missingVersion).toBeUndefined();
          missingVersion = _.find(remoteVersions, { tag_name: "7.0.4" });
          expect(missingVersion).toBeUndefined();
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });
  });

  describe("Provide latest remote version by platforms", () => {
    it("should provide latest desktop remote version (windows)", done => {
      // Given
      const expectedVersion = "7.0.6";
      const platform = Platform.WINDOWS;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: expectedVersion,
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.5",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform);

      // Then
      promise.then(
        remoteVersion => {
          expect(remoteVersion.tag_name).toEqual(expectedVersion);
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should provide latest desktop remote version (windows) w/ missing win binaries on last version", done => {
      // Given
      const expectedVersion = "7.0.5";
      const platform = Platform.WINDOWS;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.7",
          draft: false,
          prerelease: false,
          assets: [{ name: "web_extension.zip" }] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.6",
          draft: false,
          prerelease: false,
          assets: [{ name: "web_extension.zip" }] as Partial<GhAsset[]>
        },
        {
          tag_name: expectedVersion,
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.4",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform);

      // Then
      promise.then(
        remoteVersion => {
          expect(remoteVersion.tag_name).toEqual(expectedVersion);
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should provide latest desktop remote version (macos) w/ last version flagged as draft", done => {
      // Given
      const expectedVersion = "7.0.5";
      const platform = Platform.MACOS;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.6",
          draft: true,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: expectedVersion,
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform);

      // Then
      promise.then(
        remoteVersion => {
          expect(remoteVersion.tag_name).toEqual(expectedVersion);
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should provide latest desktop remote version (macos) w/ last version flagged as prerelease", done => {
      // Given
      const expectedVersion = "7.0.5";
      const platform = Platform.MACOS;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.6",
          draft: false,
          prerelease: true,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: expectedVersion,
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform);

      // Then
      promise.then(
        remoteVersion => {
          expect(remoteVersion.tag_name).toEqual(expectedVersion);
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should provide latest desktop remote version (linux debian) w/ last version flagged as prerelease (prerelease allowed)", done => {
      // Given
      const expectedVersion = "7.0.6";
      const platform = Platform.LINUX;
      const acceptPreReleases = true;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: expectedVersion,
          draft: false,
          prerelease: true,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.5",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.deb" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform, acceptPreReleases);

      // Then
      promise.then(
        remoteVersion => {
          expect(remoteVersion.tag_name).toEqual(expectedVersion);
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should not provide latest desktop remote version (linux debian) w/ no linux releases available", done => {
      // Given
      const platform = Platform.LINUX;
      const acceptPreReleases = true;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.0.6",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        },
        {
          tag_name: "7.0.5",
          draft: false,
          prerelease: false,
          assets: [
            { name: "elevate_installer.exe" },
            { name: "elevate_installer.dmg" },
            { name: "web_extension.zip" }
          ] as Partial<GhAsset[]>
        }
      ];

      spyOn(service.httpClient, "get").and.returnValue(of(releases));

      // When
      const promise = service.getLatestGithubReleaseByPlatform(platform, acceptPreReleases);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err).toBeDefined();
          done();
        }
      );
    });
  });
});
