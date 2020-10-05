import { TestBed } from "@angular/core/testing";
import { DesktopVersionsProvider } from "./desktop-versions-provider.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DesktopModule } from "../../../modules/desktop/desktop.module";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { of } from "rxjs";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { PropertiesModel } from "@elevate/shared/models";

describe("DesktopVersionsProvider", () => {
    let service: DesktopVersionsProvider;

    beforeEach(done => {
        TestBed.configureTestingModule({
            imports: [CoreModule, SharedModule, DesktopModule],
            providers: [DesktopVersionsProvider, { provide: DataStore, useClass: TestingDataStore }],
        });

        // Retrieve injected preferencesService
        service = TestBed.inject(DesktopVersionsProvider);

        done();
    });

    it("should provide version from package ran", done => {
        // Given
        const expectedVersion = "6.6.6";
        const packageDefinition: Partial<PackageManifest> = { version: expectedVersion };
        spyOn(service, "packageManifest").and.returnValue(packageDefinition as PackageManifest);

        // When
        const promise = service.getPackageVersion();

        // Then
        promise.then(
            currentVersion => {
                expect(currentVersion).toEqual(expectedVersion);
                done();
            },
            () => {
                throw new Error("Should not be here");
            }
        );
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

    it("should provide remote published version", done => {
        // Given
        const expectedVersion = "7.7.7";
        const packageDefinition: any = {
            version: expectedVersion,
            build: {
                publish: {
                    owner: "thomaschampagne",
                    provider: "github",
                    repo: "elevate",
                },
            },
        };

        const expectedGithubReleaseApiUrl = `https://api.github.com/repos/${packageDefinition.build.publish.owner}/${packageDefinition.build.publish.repo}/releases`;

        const githubRepoReleaseResponse = [
            {
                tag_name: expectedVersion,
                target_commitish: "master",
                name: expectedVersion,
                draft: false,
                prerelease: false,
                created_at: "2019-12-08T20:22:10Z",
                published_at: "2019-12-22T13:22:43Z",
            },
            {
                tag_name: "6.6.6",
                target_commitish: "master",
                name: "6.6.6",
                draft: false,
                prerelease: false,
                created_at: "2019-11-08T20:22:10Z",
                published_at: "2019-11-22T13:22:43Z",
            },
        ];

        spyOn(service, "packageManifest").and.returnValue(packageDefinition);
        const httpGetSpy = spyOn(service.httpClient, "get").and.returnValue(of(githubRepoReleaseResponse));

        // When
        const promise = service.getRemoteVersion();

        // Then
        promise.then(
            remoteVersion => {
                expect(remoteVersion).toEqual(expectedVersion);
                expect(httpGetSpy).toHaveBeenCalledWith(expectedGithubReleaseApiUrl);
                done();
            },
            () => {
                throw new Error("Should not be here");
            }
        );
    });

    it("should not provide remote draft version", done => {
        // Given
        const expectedVersion = "7.7.7";
        const packageDefinition: any = {
            version: expectedVersion,
            build: {
                publish: {
                    owner: "thomaschampagne",
                    provider: "github",
                    repo: "elevate",
                },
            },
        };

        const expectedGithubReleaseApiUrl = `https://api.github.com/repos/${packageDefinition.build.publish.owner}/${packageDefinition.build.publish.repo}/releases`;

        const githubRepoReleaseResponse = [
            {
                tag_name: expectedVersion,
                target_commitish: "master",
                name: expectedVersion,
                draft: true,
                prerelease: false,
                created_at: "2019-12-08T20:22:10Z",
                published_at: "2019-12-22T13:22:43Z",
            },
            {
                tag_name: "6.6.6",
                target_commitish: "master",
                name: "6.6.6",
                draft: false,
                prerelease: false,
                created_at: "2019-11-08T20:22:10Z",
                published_at: "2019-11-22T13:22:43Z",
            },
        ];

        spyOn(service, "packageManifest").and.returnValue(packageDefinition);
        const httpGetSpy = spyOn(service.httpClient, "get").and.returnValue(of(githubRepoReleaseResponse));

        // When
        const promise = service.getRemoteVersion();

        // Then
        promise.then(
            remoteVersion => {
                expect(remoteVersion).toBeNull();
                expect(httpGetSpy).toHaveBeenCalledWith(expectedGithubReleaseApiUrl);
                done();
            },
            () => {
                throw new Error("Should not be here");
            }
        );
    });
});
