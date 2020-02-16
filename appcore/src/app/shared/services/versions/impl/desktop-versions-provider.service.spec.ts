import { TestBed } from "@angular/core/testing";
import { DesktopVersionsProvider } from "./desktop-versions-provider.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DesktopModule } from "../../../modules/desktop/desktop.module";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { of } from "rxjs";
import { MockedDataStore } from "../../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../../data-store/data-store";

describe("DesktopVersionsProvider", () => {

	let service: DesktopVersionsProvider;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<string> = new MockedDataStore(null);

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			],
			providers: [
				DesktopVersionsProvider,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected preferencesService
		service = TestBed.inject(DesktopVersionsProvider);

		done();
	});

	it("should provide version from package ran", (done: Function) => {

		// Given
		const expectedVersion = "6.6.6";
		const packageDefinition: Partial<PackageManifest> = {version: expectedVersion};
		spyOn(service, "packageManifest").and.returnValue(packageDefinition);

		// When
		const promise = service.getPackageVersion();

		// Then
		promise.then(currentVersion => {
			expect(currentVersion).toEqual(expectedVersion);
			done();
		}, () => {
			throw new Error("Should not be here");
		});

	});

	it("should provide the saved version", (done: Function) => {

		// Given
		const expectedVersion = "5.5.5";
		const getItemSpy = spyOn(localStorage, "getItem").and.returnValue(expectedVersion);

		// When
		const promise = service.getSavedVersion();

		// Then
		promise.then(previousVersion => {
			expect(previousVersion).toEqual(expectedVersion);
			expect(getItemSpy).toHaveBeenCalledWith(DesktopVersionsProvider.DESKTOP_SAVED_VERSION_KEY);
			done();
		}, () => {
			throw new Error("Should not be here");
		});

	});

	it("should provide remote published version", (done: Function) => {

		// Given
		const expectedVersion = "7.7.7";
		const packageDefinition: any = {
			version: expectedVersion,
			build: {
				publish: {
					"owner": "thomaschampagne",
					"provider": "github",
					"repo": "elevate"
				}
			}
		};

		const expectedGithubReleaseApiUrl = `https://api.github.com/repos/${packageDefinition.build.publish.owner}/${packageDefinition.build.publish.repo}/releases`;

		const githubRepoReleaseResponse = [{
			"tag_name": expectedVersion,
			"target_commitish": "master",
			"name": expectedVersion,
			"draft": false,
			"prerelease": false,
			"created_at": "2019-12-08T20:22:10Z",
			"published_at": "2019-12-22T13:22:43Z",
		}, {
			"tag_name": "6.6.6",
			"target_commitish": "master",
			"name": "6.6.6",
			"draft": false,
			"prerelease": false,
			"created_at": "2019-11-08T20:22:10Z",
			"published_at": "2019-11-22T13:22:43Z",
		}];

		spyOn(service, "packageManifest").and.returnValue(packageDefinition);
		const httpGetSpy = spyOn(service.httpClient, "get").and.returnValue(of(githubRepoReleaseResponse));

		// When
		const promise = service.getRemoteVersion();

		// Then
		promise.then(remoteVersion => {
			expect(remoteVersion).toEqual(expectedVersion);
			expect(httpGetSpy).toHaveBeenCalledWith(expectedGithubReleaseApiUrl);
			done();
		}, () => {
			throw new Error("Should not be here");
		});

	});

	it("should not provide remote draft version", (done: Function) => {

		// Given
		const expectedVersion = "7.7.7";
		const packageDefinition: any = {
			version: expectedVersion,
			build: {
				publish: {
					"owner": "thomaschampagne",
					"provider": "github",
					"repo": "elevate"
				}
			}
		};

		const expectedGithubReleaseApiUrl = `https://api.github.com/repos/${packageDefinition.build.publish.owner}/${packageDefinition.build.publish.repo}/releases`;

		const githubRepoReleaseResponse = [{
			"tag_name": expectedVersion,
			"target_commitish": "master",
			"name": expectedVersion,
			"draft": true,
			"prerelease": false,
			"created_at": "2019-12-08T20:22:10Z",
			"published_at": "2019-12-22T13:22:43Z",
		}, {
			"tag_name": "6.6.6",
			"target_commitish": "master",
			"name": "6.6.6",
			"draft": false,
			"prerelease": false,
			"created_at": "2019-11-08T20:22:10Z",
			"published_at": "2019-11-22T13:22:43Z",
		}];

		spyOn(service, "packageManifest").and.returnValue(packageDefinition);
		const httpGetSpy = spyOn(service.httpClient, "get").and.returnValue(of(githubRepoReleaseResponse));

		// When
		const promise = service.getRemoteVersion();

		// Then
		promise.then(remoteVersion => {
			expect(remoteVersion).toBeNull();
			expect(httpGetSpy).toHaveBeenCalledWith(expectedGithubReleaseApiUrl);
			done();
		}, () => {
			throw new Error("Should not be here");
		});

	});

});
