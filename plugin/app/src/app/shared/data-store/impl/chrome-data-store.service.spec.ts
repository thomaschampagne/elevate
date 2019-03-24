import { TestBed } from "@angular/core/testing";
import { ChromeDataStore } from "./chrome-data-store.service";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";
import { AppUsage } from "../../models/app-usage.model";
import { AppUsageDetails } from "../../models/app-usage-details.model";

describe("ChromeDataStore", () => {

	class DreamInception {
		dream0: {
			dream1: {
				dream2: string
			}
		};
	}

	class Foo extends Object {
		id: string;
		bar: string | boolean;
		nested?: DreamInception;
	}

	let chromeDataStore: ChromeDataStore<Foo>;
	let storageLocation: StorageLocationModel;
	let browserStorageLocalSpy: jasmine.Spy;
	let browserStorageErrorSpy: jasmine.Spy;

	const CHROME_QUOTA_BYTES = 1024;
	const CHROME_BYTES_IN_USE = 512;
	let CHROME_STORAGE_STUB = {};
	let DEFAULT_FOO: Foo;

	const chromeStorageBehaviour = () => {
		return {
			get: (query: Object | string | string[], callback: (item: Object) => {}) => {
				if (_.isString(query)) {
					const response = {};
					if (CHROME_STORAGE_STUB[query]) {
						response[query] = CHROME_STORAGE_STUB[query];
					}
					callback(response);

				} else if (_.isArray(query) && query.length > 0) {

					const response = {};
					_.forEach(query, (key: string) => {
						if (!_.isUndefined(CHROME_STORAGE_STUB[key])) {
							response[key] = CHROME_STORAGE_STUB[key];
						}
					});
					callback(response);
				} else if (_.isObject(query)) {
					const response = _.cloneDeep(query);
					_.forEach(_.keys(response), (key: string) => {
						if (!_.isUndefined(CHROME_STORAGE_STUB[key])) {
							response[key] = CHROME_STORAGE_STUB[key];
						}
					});
					callback(response);
				} else if (_.isUndefined(query) || _.isNull(query)) {
					callback(CHROME_STORAGE_STUB);
				} else {
					callback({});
				}
			},
			set: (object: Object, callback: () => {}) => {
				if (!_.isObject(object)) {
					throw new Error("Must be an object");
				}
				_.forEach(_.keys(object), (key: string) => {
					CHROME_STORAGE_STUB[key] = object[key];
				});
				callback();
			},
			remove: (key: string, callback: () => {}) => {
				delete CHROME_STORAGE_STUB[key];
				callback();
			},
			clear: (callback: () => {}) => {
				CHROME_STORAGE_STUB = {};
				callback();
			},
			QUOTA_BYTES: CHROME_QUOTA_BYTES,
			getBytesInUse: (callback: (bytesInUse: number) => {}) => {
				callback(CHROME_BYTES_IN_USE);
			}
		};
	};

	beforeEach((done: Function) => {

		storageLocation = {
			key: "foo",
			storageType: null,
			collectionFieldId: null
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
		DEFAULT_FOO = {
			id: "0001",
			bar: "I am the default one"
		};

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
			id: "0001",
			bar: "john doe"
		}];

		CHROME_STORAGE_STUB[storageLocation.key] = expectedData;

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.fetch(storageLocation, DEFAULT_FOO);

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

	it("should fetch empty data (vector)", (done: Function) => {

		// Given
		CHROME_STORAGE_STUB = {};
		const defaultValue = [];

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.fetch(storageLocation, defaultValue);

		// Then
		promise.then((result: Foo[]) => {

			expect(result).toEqual(defaultValue);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should fetch empty data (object))", (done: Function) => {

		// Given
		CHROME_STORAGE_STUB = {};
		const defaultValue: Foo = {
			id: "0001",
			bar: "john doe"
		};

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.fetch(storageLocation, defaultValue);

		// Then
		promise.then((result: Foo) => {
			expect(result).not.toBeNull();
			expect(result).toEqual(defaultValue);
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
			id: "0001",
			bar: "john doe"
		};

		CHROME_STORAGE_STUB = expectedData;

		storageLocation = new StorageLocationModel(); // Override CHROME_STORAGE_STUB location with no key

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.fetch(storageLocation, DEFAULT_FOO);

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

	it("should fetch default value when storage is empty (and no key provided)", (done: Function) => {

		// Given
		const defaultValue: Foo = {
			id: "0001",
			bar: "Default Bar"
		};

		storageLocation = new StorageLocationModel(); // Override CHROME_STORAGE_STUB location with no key

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.fetch(storageLocation, defaultValue);

		// Then
		promise.then((result: Foo) => {
			expect(result).not.toBeNull();
			expect(result).toEqual(defaultValue);
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
			id: "0001",
			bar: "john doe"
		}];

		const expectedChromeStorageStubState: { foo: Foo[] } = {
			foo: toBeSaved
		};

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.save(storageLocation, toBeSaved, DEFAULT_FOO);

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
			id: "0001",
			bar: "john doe"
		};

		storageLocation = new StorageLocationModel(); // Override CHROME_STORAGE_STUB location with no key

		// When
		const promise: Promise<Foo> = <Promise<Foo>> chromeDataStore.save(storageLocation, toBeSaved, DEFAULT_FOO);

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
			id: "0001",
			bar: "john doe"
		}];

		const expectedChromeError = {message: "Houston we have a problem"};
		browserStorageErrorSpy.and.returnValue(expectedChromeError);

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> chromeDataStore.save(storageLocation, saveData, DEFAULT_FOO);

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
			id: "0001",
			bar: "sheldon"
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = "bar";
		const newValue = "Bazinga!";

		const expectedChromeStorageStubState: { foo: Foo } = _.cloneDeep(CHROME_STORAGE_STUB) as { foo: Foo };
		expectedChromeStorageStubState.foo.bar = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.upsertProperty<string>(storageLocation, relativePath, newValue, DEFAULT_FOO);

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
			id: "0001",
			bar: false
		};

		CHROME_STORAGE_STUB[storageLocation.key] = currentFoo;

		const relativePath = "bar";
		const newValue = true;

		const expectedChromeStorageStubState: { foo: Foo } = _.cloneDeep(CHROME_STORAGE_STUB) as { foo: Foo };
		expectedChromeStorageStubState.foo.bar = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.upsertProperty<boolean>(storageLocation, relativePath, newValue, DEFAULT_FOO);

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
			id: "0001",
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
		const promise: Promise<Foo> = chromeDataStore.upsertProperty<string>(storageLocation, relativePath, newValue, DEFAULT_FOO);

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

	it("should save nested property (no key provided)", (done: Function) => {

		// Given
		storageLocation = new StorageLocationModel(); // Override CHROME_STORAGE_STUB location with no key

		const currentFoo: Foo = {
			id: "0001",
			bar: "sheldon",
			nested: {
				dream0: {
					dream1: {
						dream2: "Wahoo"
					}
				}
			}
		};

		CHROME_STORAGE_STUB = currentFoo;

		const relativePath = ["nested", "dream0", "dream1", "dream2"];
		const newValue = "Bazinga!";
		const expectedChromeStorageStubState: Foo = _.cloneDeep(CHROME_STORAGE_STUB) as Foo;
		expectedChromeStorageStubState.nested.dream0.dream1.dream2 = newValue;

		// When
		const promise: Promise<Foo> = chromeDataStore.upsertProperty<string>(storageLocation, relativePath, newValue, DEFAULT_FOO);

		// Then
		promise.then((result: Foo) => {


			expect(result).not.toBeNull();
			expect(result).toEqual(expectedChromeStorageStubState);
			expect(CHROME_STORAGE_STUB).toEqual(expectedChromeStorageStubState);

			done();

		}, error => {
			expect(error).toBeNull();
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
		const promise: Promise<Foo> = chromeDataStore.upsertProperty<string>(storageLocation, relativePath, newValue, DEFAULT_FOO);

		// Then
		promise.then((result: Foo) => {
			expect(result).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Cannot save property to a storage type 'vector'");
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
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should clear all chrome storage data (no key provided)", (done: Function) => {

		// Given
		CHROME_STORAGE_STUB = {nothing: "everything"};
		storageLocation = new StorageLocationModel(); // Override CHROME_STORAGE_STUB location with no key
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
		const expectedChromeError = {message: "Houston we have a problem"};
		browserStorageErrorSpy.and.returnValue(expectedChromeError);

		// When
		const promise: Promise<void> = chromeDataStore.clear(storageLocation);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedChromeError.message);
			done();
		});
	});

	it("should provide AppUsageDetails", (done: Function) => {

		// Given
		const appUsage: AppUsage = new AppUsage(CHROME_BYTES_IN_USE, CHROME_QUOTA_BYTES);

		const expectedAppUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage,
			CHROME_BYTES_IN_USE / (1024 * 1024),
			CHROME_BYTES_IN_USE / CHROME_QUOTA_BYTES * 100);

		// When
		const promise: Promise<AppUsageDetails> = chromeDataStore.getAppUsageDetails();

		// Then
		promise.then((result: AppUsageDetails) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedAppUsageDetails);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should get by id a Foo into a collection", (done: Function) => {

		// Given
		const id = "0002";
		const expectedResult = {
			id: id,
			bar: "jean kevin"
		};

		const expectedData: Foo[] = [{
			id: "0001",
			bar: "john doe"
		}, expectedResult, {
			id: "0003",
			bar: "colette sterolle"
		}];

		storageLocation = {
			key: "foo",
			storageType: null,
			collectionFieldId: "id"
		};


		CHROME_STORAGE_STUB[storageLocation.key] = expectedData;

		// When
		const promise: Promise<Foo> = chromeDataStore.getById(storageLocation, id);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedResult);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should get by id a Foo as object or property", (done: Function) => {

		// Given
		const expectedFoo: Foo = {
			id: "0001",
			bar: "jean kevin"
		};

		CHROME_STORAGE_STUB = {
			other01: {},
			foo: expectedFoo,
			other02: {},
		};

		storageLocation = {
			key: "foo",
			storageType: null,
			collectionFieldId: null
		};

		const id = "foo";

		// When
		const promise: Promise<Foo> = chromeDataStore.getById(storageLocation, id);

		// Then
		promise.then((result: Foo) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedFoo);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
