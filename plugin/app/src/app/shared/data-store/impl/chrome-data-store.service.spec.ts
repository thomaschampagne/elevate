import { TestBed } from "@angular/core/testing";
import { ChromeDataStore } from "./chrome-data-store.service";
import { AppStorageType } from "@elevate/shared/models";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";

describe("ChromeDataStore", () => {

	class DreamInception {
		dream0: {
			dream1: {
				dream2: string
			}
		};
	}

	class Foo extends Object {
		bar: string | boolean;
		nested?: DreamInception;
	}

	let chromeDataStore: ChromeDataStore<Foo>;
	let storageLocation: StorageLocationModel;
	let browserStorageLocalSpy: jasmine.Spy;
	let browserStorageErrorSpy: jasmine.Spy;

	let CHROME_STORAGE_STUB = {};
	const chromeStorageBehaviour = () => {
		return {
			get: (keys: any, callback: (item: Object) => {}) => {
				if (storageLocation.key) {
					const response = {};
					response[storageLocation.key] = CHROME_STORAGE_STUB[storageLocation.key];
					callback(response);
				} else {
					callback(CHROME_STORAGE_STUB);
				}
			},
			set: (object: Object, callback: () => {}) => {
				CHROME_STORAGE_STUB = object;
				callback();
			},
			remove: (key: string, callback: () => {}) => {
				if (!key) {
					throw new Error("Key cannot be empty");
				}
				delete CHROME_STORAGE_STUB[key];
				callback();
			},
			clear: (callback: () => {}) => {
				CHROME_STORAGE_STUB = {};
				callback();
			}
		};
	};

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

		// Mock CHROME_STORAGE_STUB
		browserStorageLocalSpy = spyOn(chromeDataStore, "chromeLocalStorageArea").and.callFake(chromeStorageBehaviour);
		CHROME_STORAGE_STUB = {}; // Erase storage

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

		CHROME_STORAGE_STUB[storageLocation.key] = expectedData;

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.fetch(storageLocation);

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
		CHROME_STORAGE_STUB = {};

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.fetch(storageLocation);

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

	it("should fetch all chrome storage data (no key provided)", (done: Function) => {

		// Given
		const expectedData: Foo = {
			bar: "john doe"
		};

		CHROME_STORAGE_STUB = expectedData;

		storageLocation = new StorageLocationModel(AppStorageType.LOCAL); // Override CHROME_STORAGE_STUB location with no key

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.fetch(storageLocation);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedData);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save data", (done: Function) => {

		// Given
		CHROME_STORAGE_STUB[storageLocation.key] = null;

		const toBeSaved: Foo[] = [{
			bar: "john doe"
		}];

		const expectedChromeStorageStubState: { foo: Foo[] } = {
			foo: toBeSaved
		};

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.save(storageLocation, toBeSaved);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(toBeSaved);
			expect(CHROME_STORAGE_STUB).toEqual(expectedChromeStorageStubState);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save all chrome storage data (no key provided)", (done: Function) => {

		// Given
		const toBeSaved: Foo = {
			bar: "john doe"
		};

		storageLocation = new StorageLocationModel(AppStorageType.LOCAL); // Override CHROME_STORAGE_STUB location with no key

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.save(storageLocation, toBeSaved);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(toBeSaved);
			expect(CHROME_STORAGE_STUB).toEqual(toBeSaved);
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

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.save(storageLocation, saveData);

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

	it("should save property of a Foo (string)", (done: Function) => {

		// Given
		const currentFoo: Foo = {
			bar: "sheldon"
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = "bar";
		const newValue = "Bazinga!";

		const expectedChromeStorageStubState: { foo: Foo } = _.cloneDeep(CHROME_STORAGE_STUB) as { foo: Foo };
		expectedChromeStorageStubState.foo.bar = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.saveProperty<string>(storageLocation, relativePath, newValue);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedChromeStorageStubState.foo);
			expect(CHROME_STORAGE_STUB).toEqual(expectedChromeStorageStubState);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save property of a Foo (boolean)", (done: Function) => {

		// Given
		const currentFoo: Foo = {
			bar: false
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = "bar";
		const newValue = true;

		const expectedChromeStorageStubState: { foo: Foo } = _.cloneDeep(CHROME_STORAGE_STUB) as { foo: Foo };
		expectedChromeStorageStubState.foo.bar = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.saveProperty<boolean>(storageLocation, relativePath, newValue);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedChromeStorageStubState.foo);
			expect(CHROME_STORAGE_STUB).toEqual(expectedChromeStorageStubState);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save nested property", (done: Function) => {

		// Given
		const currentFoo: Foo = {
			bar: "sheldon",
			nested: {
				dream0: {
					dream1: {
						dream2: "Wahoo"
					}
				}
			}
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = ["nested", "dream0", "dream1", "dream2"];
		const newValue = "Bazinga!";
		const expectedChromeStorageStubState: { foo: Foo } = _.cloneDeep(CHROME_STORAGE_STUB) as { foo: Foo };
		expectedChromeStorageStubState.foo.nested.dream0.dream1.dream2 = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.saveProperty<string>(storageLocation, relativePath, newValue);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedChromeStorageStubState.foo);
			expect(CHROME_STORAGE_STUB).toEqual(expectedChromeStorageStubState);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject save nested property", (done: Function) => {

		// Given
		const currentFoo: Foo = {
			bar: "sheldon",
			nested: {
				dream0: {
					dream1: {
						dream2: "Wahoo"
					}
				}
			}
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = ["nested", "dream0", "dream1", "fake"];
		const newValue = "Bazinga!";

		// When
		const promise: Promise<Foo> = chromeDataStore.saveProperty<string>(storageLocation, relativePath, newValue);

		// Then
		promise.then((result: Foo) => {
			expect(result).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Property at path 'nested>dream0>dream1>fake' do not exists");
			done();
		});
	});

	it("should reject save property with Foo[]", (done: Function) => {

		// Given
		const currentFooList = [{
			bar: "john doe",
			nested: {
				dream0: {
					dream1: {
						dream2: "Wahoo"
					}
				}
			}
		}];

		CHROME_STORAGE_STUB[storageLocation.key] = currentFooList;

		const relativePath = ["nested", "dream0", "dream1", "dream2"];
		const newValue = "Bazinga!";

		// When
		const promise: Promise<Foo> = chromeDataStore.saveProperty<string>(storageLocation, relativePath, newValue);

		// Then
		promise.then((result: Foo) => {
			expect(result).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("No root key 'nested' found");
			done();
		});

	});

	it("should clear data", (done: Function) => {

		// Given
		const otherData = {otherData: "I am another data"};
		CHROME_STORAGE_STUB = otherData;
		CHROME_STORAGE_STUB[storageLocation.key] = "FakeData";

		// When
		const promise: Promise<void> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then(() => {

			expect(CHROME_STORAGE_STUB).toEqual(otherData);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should clear all chrome storage data (no key provided)", (done: Function) => {

		// Given
		CHROME_STORAGE_STUB = {nothing: "everything"};
		storageLocation = new StorageLocationModel(AppStorageType.LOCAL); // Override CHROME_STORAGE_STUB location with no key
		const expectedResult = <Foo> {};

		// When
		const promise: Promise<void> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then(() => {
			expect(CHROME_STORAGE_STUB).toEqual(expectedResult);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject clear data", (done: Function) => {

		// Given
		const fetchDataNotCleared: Foo[] = [{
			bar: "john doe"
		}];

		spyOn(chromeDataStore, "fetch").and.returnValue(Promise.resolve(fetchDataNotCleared));

		// When
		const promise: Promise<void> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Unable to clear data on storage location: " + JSON.stringify(storageLocation));
			done();
		});
	});

});
