import { TestBed } from "@angular/core/testing";
import { ChromeDataStore } from "./chrome-data-store.service";
import { AppStorageType } from "@elevate/shared/models";
import { StorageLocation } from "../storage-location";

describe("ChromeDataStore", () => {

	class Foo {
		bar: string;
	}

	const chromeResponseCallback = <T>(storageKey: string, getResponseData: T[]) => {
		return {
			get: (keys: any, callback: (item: Object) => {}) => {
				const response = {};
				response[storageKey] = getResponseData;
				callback(response);
			},
			set: (object: Object, callback: () => {}) => {
				callback();
			},
			remove: (key: string, callback: () => {}) => {
				callback();
			}
		};
	};

	let chromeDataStore: ChromeDataStore<Foo>;
	let storageLocation: StorageLocation;
	let browserStorageLocalSpy: jasmine.Spy;
	let browserStorageErrorSpy: jasmine.Spy;

	beforeEach((done: Function) => {

		storageLocation = {
			key: "foo",
			type: AppStorageType.LOCAL
		};

		TestBed.configureTestingModule({
			providers: [
				ChromeDataStore
			]
		});

		chromeDataStore = TestBed.get(ChromeDataStore);

		// Mock storage
		browserStorageLocalSpy = spyOn(chromeDataStore, "chromeLocalStorageArea");

		// Mock chrome errors. Return no errors by default
		browserStorageErrorSpy = spyOn(chromeDataStore, "getLastError");
		browserStorageErrorSpy.and.returnValue(null);

		done();
	});

	it("should be created", (done: Function) => {
		expect(chromeDataStore).toBeTruthy();
		done();
	});


	it("should fetch data", (done: Function) => {

		// Given
		const expectedData: Foo[] = [{
			bar: "john doe"
		}];

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, expectedData));

		// When
		const promise: Promise<Foo[]> = chromeDataStore.fetch(storageLocation);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedData);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});


	it("should fetch empty data", (done: Function) => {

		// Given
		const getResponseData: Foo[] = undefined;

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, getResponseData));

		// When
		const promise: Promise<Foo[]> = chromeDataStore.fetch(storageLocation);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).toBeNull();
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save data", (done: Function) => {

		// Given
		const expectedData: Foo[] = [{
			bar: "john doe"
		}];

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, expectedData));

		// When
		const promise: Promise<Foo[]> = chromeDataStore.save(storageLocation, expectedData);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedData);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject save data", (done: Function) => {

		// Given
		const saveData: Foo[] = [{
			bar: "john doe"
		}];

		const expectedChromeError = {message: "Error !!!"};
		browserStorageErrorSpy.and.returnValue(expectedChromeError);

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, saveData));


		// When
		const promise: Promise<Foo[]> = chromeDataStore.save(storageLocation, saveData);

		// Then
		promise.then((result: Foo[]) => {
			expect(result).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedChromeError.message);
			done();
		});
	});

	it("should clear data", (done: Function) => {

		// Given
		const getResponseData = undefined;

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, getResponseData));

		// When
		const promise: Promise<Foo[]> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).toBeNull();
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject clear data", (done: Function) => {

		// Given
		const getResponseData: Foo[] = [{
			bar: "john doe"
		}];

		browserStorageLocalSpy.and.returnValue(chromeResponseCallback<Foo>(storageLocation.key, getResponseData));

		// When
		const promise: Promise<Foo[]> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then((result: Foo[]) => {
			expect(result).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Unable to clear data on storage location: " + JSON.stringify(storageLocation));
			done();
		});
	});

});
