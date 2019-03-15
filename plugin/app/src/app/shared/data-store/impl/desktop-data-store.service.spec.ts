import { TestBed } from "@angular/core/testing";

import { DesktopDataStore } from "./desktop-data-store.service";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";
import PouchDB from "pouchdb-browser";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";
import Spy = jasmine.Spy;

describe("DesktopDataStore", () => {

	describe("Handle collection", () => {

		class FakePerson extends Object {
			_id: string;
			name: string;
			age: number;
		}

		let desktopDataStore: DesktopDataStore<FakePerson>;

		let getCollectionSpy: Spy;

		const fakePersonsStorageLocation = new StorageLocationModel("fakePersons");

		const fakePersons: FakePerson[] = [{
			_id: "001",
			name: "Jean Kevin",
			age: 12
		}, {
			_id: "002",
			name: "Colette Sterolle",
			age: 54
		}];

		beforeEach((done: Function) => {

			TestBed.configureTestingModule({
				providers: [
					DesktopDataStore,
					{provide: LoggerService, useClass: ConsoleLoggerService}
				]
			});

			desktopDataStore = TestBed.get(DesktopDataStore);
			getCollectionSpy = spyOn(desktopDataStore, "getCollection").and.callThrough();

			const pouchPersonDB: PouchDB.Database<FakePerson> = <PouchDB.Database<FakePerson>>desktopDataStore.getCollection(fakePersonsStorageLocation.key);
			pouchPersonDB.allDocs().then(results => {

				expect(results.total_rows).toEqual(0);
				return pouchPersonDB.bulkDocs(fakePersons);

			}).then(result => {
				expect(result.length).toEqual(fakePersons.length);
				expect(desktopDataStore.elevateCollectionsMap.size).toEqual(1);
				getCollectionSpy.calls.reset();
				done();

			}).catch(error => {
				console.error(error);
				throw error;
			});
		});

		afterEach((done: Function) => {

			// Cleaning collection
			desktopDataStore.getCollection(fakePersonsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakePersonsStorageLocation.key);
				done();
			}).catch(error => {
				console.error(error);
				throw error;
			});
		});

		it("should fetch a FakePersons collection", (done: Function) => {

			// Given
			const expectedPerson = _.find(fakePersons, p => {
				return p._id === "001";
			});

			// When
			const promise: Promise<FakePerson[]> = <Promise<FakePerson[]>>desktopDataStore.fetch(fakePersonsStorageLocation, null, []);

			// Then
			promise.then((results: FakePerson[]) => {

				const fetchedPerson = _.find(results, p => {
					return p._id === "001";
				});

				expect(fetchedPerson._id).toEqual(expectedPerson._id);
				expect(fetchedPerson.name).toEqual(expectedPerson.name);
				expect(fetchedPerson.age).toEqual(expectedPerson.age);

				expect(results.length).toEqual(fakePersons.length);
				expect(getCollectionSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should fetch default storage value when FakePersons collection is missing", (done: Function) => {

			// Given
			const defaultStorageValue = [];
			const promiseMissingCollection = desktopDataStore.getCollection(fakePersonsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakePersonsStorageLocation.key);
				getCollectionSpy.calls.reset();
				return Promise.resolve();
			});

			// When
			const promise: Promise<FakePerson[]> = promiseMissingCollection.then(() => {
				return <Promise<FakePerson[]>>desktopDataStore.fetch(fakePersonsStorageLocation, null, defaultStorageValue);
			});

			// Then
			promise.then((results: FakePerson[]) => {

				expect(results).toEqual(defaultStorageValue);
				expect(getCollectionSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save and replace an existing FakePersons collection", (done: Function) => {

			// Given
			const expectedLength = 3;
			const newFakePersons: FakePerson[] = [{
				_id: "003",
				name: "Robert Binouse",
				age: 55
			}, {
				_id: "004",
				name: "Marta Tinette",
				age: 62
			}, {
				_id: "005",
				name: "Jack Adi",
				age: 37
			}];

			const expectedPerson = _.find(newFakePersons, p => {
				return p._id === "004";
			});

			// When
			const promise: Promise<FakePerson[]> = <Promise<FakePerson[]>>desktopDataStore.save(fakePersonsStorageLocation, newFakePersons, []);

			// Then
			promise.then((results: FakePerson[]) => {

				expect(results).not.toBeNull();

				// Test new person added
				const fetchedNewPerson: FakePerson = <FakePerson>_.find(results, {_id: "004"});
				expect(fetchedNewPerson._id).toEqual(expectedPerson._id);
				expect(fetchedNewPerson.name).toEqual(expectedPerson.name);
				expect(fetchedNewPerson.age).toEqual(expectedPerson.age);

				// Test person removed
				const unknownPerson = <FakePerson>_.find(results, {_id: "001"});
				expect(unknownPerson).toBeUndefined();

				expect(results.length).toEqual(expectedLength);
				expect(getCollectionSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should save and replace an existing FakePersons collection (including updates of some rows)", (done: Function) => {

			// Given
			const expectedLength = 4;
			const updatedFakePerson = _.cloneDeep(<FakePerson>_.find(fakePersons, {_id: "002"}));
			updatedFakePerson.age = 99;

			const newFakePersons: FakePerson[] = [
				updatedFakePerson, {
					_id: "003",
					name: "Robert Binouse",
					age: 55
				}, {
					_id: "004",
					name: "Marta Tinette",
					age: 62
				}, {
					_id: "005",
					name: "Jack Adi",
					age: 37
				}];

			const expectedPerson = _.find(newFakePersons, p => {
				return p._id === "004";
			});


			// When
			const promise: Promise<FakePerson[]> = <Promise<FakePerson[]>>desktopDataStore.save(fakePersonsStorageLocation, newFakePersons, []);

			// Then
			promise.then((results: FakePerson[]) => {

				expect(results).not.toBeNull();

				// Test new person added
				const fetchedNewPerson: FakePerson = <FakePerson>_.find(results, {_id: "004"});
				expect(fetchedNewPerson._id).toEqual(expectedPerson._id);
				expect(fetchedNewPerson.name).toEqual(expectedPerson.name);
				expect(fetchedNewPerson.age).toEqual(expectedPerson.age);

				// Test update of person
				const fetchedUpdatedPerson = <FakePerson>_.find(results, {_id: "002"});
				expect(fetchedUpdatedPerson._id).toEqual(updatedFakePerson._id);
				expect(fetchedUpdatedPerson.name).toEqual(updatedFakePerson.name);
				expect(fetchedUpdatedPerson.age).toEqual(updatedFakePerson.age);

				// Test person removed
				const unknownPerson = <FakePerson>_.find(results, {_id: "001"});
				expect(unknownPerson).toBeUndefined();

				expect(results.length).toEqual(expectedLength);
				expect(getCollectionSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject upsert of a FakePersons collection", (done: Function) => {

			// Given
			const newValue = _.cloneDeep(<FakePerson>_.find(fakePersons, {_id: "002"}));
			const updatePath = ["none"];

			// When
			const promise = desktopDataStore.upsertProperty(fakePersonsStorageLocation, updatePath, newValue, []);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual("Cannot save property to a collection");
				done();
			});

		});

		it("should clear FakePersons collection", (done: Function) => {

			// When
			const promise: Promise<void> = desktopDataStore.clear(fakePersonsStorageLocation);

			// Then
			promise.then(() => {

				desktopDataStore.elevateCollectionsMap.get(fakePersonsStorageLocation.key).allDocs().then(result => {
					expect(result.total_rows).toEqual(0);
					done();
				});
			});
		});

	});

	describe("Handle object", () => {

		class FakeSettings extends Object {
			_id: string;
			setting_a: number;
			setting_b: number;
			setting_c: number;
			sub_settings?: SubSettings;
		}

		class SubSettings {
			sub_setting_a: number;
			sub_setting_b: number;
			sub_setting_c: number;
		}

		let desktopDataStore: DesktopDataStore<FakeSettings>;
		let getCollectionSpy: Spy;

		const fakeSettingsStorageLocation = new StorageLocationModel("fakeSettings");

		const fakeSettings: FakeSettings = {
			_id: "fakeSettings",
			setting_a: 11,
			setting_b: 99,
			setting_c: 32
		};

		beforeEach((done: Function) => {

			TestBed.configureTestingModule({
				providers: [
					DesktopDataStore,
					{provide: LoggerService, useClass: ConsoleLoggerService}
				]
			});

			desktopDataStore = TestBed.get(DesktopDataStore);

			getCollectionSpy = spyOn(desktopDataStore, "getCollection").and.callThrough();

			const pouchSettingsDB: PouchDB.Database<FakeSettings> = <PouchDB.Database<FakeSettings>>desktopDataStore.getCollection(fakeSettingsStorageLocation.key);
			pouchSettingsDB.allDocs().then(results => {

				expect(results.total_rows).toEqual(0);
				return pouchSettingsDB.bulkDocs([fakeSettings]);

			}).then(result => {
				expect(result.length).toEqual(1);
				expect(desktopDataStore.elevateCollectionsMap.size).toEqual(1);
				getCollectionSpy.calls.reset();
				done();

			}).catch(error => {
				console.error(error);
				throw error;
			});

		});

		afterEach((done: Function) => {

			// Cleaning collection
			desktopDataStore.getCollection(fakeSettingsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakeSettingsStorageLocation.key);
				done();
			}).catch(error => {
				console.error(error);
				throw error;
			});

		});

		it("should fetch a FakeSettings object", (done: Function) => {

			// Given
			const expectedSettings = _.cloneDeep(fakeSettings);

			// When
			const promise: Promise<FakeSettings> = <Promise<FakeSettings>>desktopDataStore.fetch(fakeSettingsStorageLocation, null, []);

			// Then
			promise.then((fakeSettings: FakeSettings) => {

				expect(fakeSettings._id).toEqual(expectedSettings._id);
				expect(fakeSettings.setting_a).toEqual(expectedSettings.setting_a);
				expect(fakeSettings.setting_b).toEqual(expectedSettings.setting_b);
				expect(fakeSettings.setting_c).toEqual(expectedSettings.setting_c);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should fetch default storage value when FakeSettings object is missing", (done: Function) => {

			// Given
			const defaultStorageValue = <FakeSettings>{
				// _id: "fakeSettings", // Missing _id for the purpose of the test.
				setting_a: 0,
				setting_b: 0,
				setting_c: 0
			};
			const promiseMissingCollection = desktopDataStore.getCollection(fakeSettingsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakeSettingsStorageLocation.key);
				getCollectionSpy.calls.reset();
				return Promise.resolve();
			});

			// When
			const promise: Promise<FakeSettings> = promiseMissingCollection.then(() => {
				return <Promise<FakeSettings>>desktopDataStore.fetch(fakeSettingsStorageLocation, null, defaultStorageValue);
			});

			// Then
			promise.then((settings: FakeSettings) => {

				expect(settings).toEqual(defaultStorageValue);
				expect(settings._id).toEqual(fakeSettingsStorageLocation.key);
				expect(getCollectionSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save and replace a FakeSettings object", (done: Function) => {

			// Given
			const newSettings = _.cloneDeep(fakeSettings);
			newSettings.setting_a = 111;
			newSettings.setting_b = 222;
			newSettings.setting_c = 333;

			// When
			const promise: Promise<FakeSettings> = <Promise<FakeSettings>>desktopDataStore.save(fakeSettingsStorageLocation, newSettings, fakeSettings);

			// Then
			promise.then((fakeSettings: FakeSettings) => {

				expect(fakeSettings._id).toEqual(fakeSettingsStorageLocation.key);
				expect(fakeSettings.setting_a).toEqual(newSettings.setting_a);
				expect(fakeSettings.setting_b).toEqual(newSettings.setting_b);
				expect(fakeSettings.setting_c).toEqual(newSettings.setting_c);

				desktopDataStore.elevateCollectionsMap.get(fakeSettingsStorageLocation.key).allDocs().then(result => {
					expect(result.total_rows).toEqual(1);
					done();
				});

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save settings when FakeSettings object is missing", (done: Function) => {

			// Given
			const newSettings = <FakeSettings>{
				setting_a: 0,
				setting_b: 0,
				setting_c: 0
			};

			const defaultSettings = <FakeSettings>{
				setting_a: 1,
				setting_b: 2,
				setting_c: 3
			};

			const promiseMissingCollection = desktopDataStore.getCollection(fakeSettingsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakeSettingsStorageLocation.key);
				return Promise.resolve();
			});

			// When
			const promise: Promise<FakeSettings> = promiseMissingCollection.then(() => {
				getCollectionSpy.calls.reset();
				return <Promise<FakeSettings>>desktopDataStore.save(fakeSettingsStorageLocation, newSettings, defaultSettings);
			});

			// Then
			promise.then((settings: FakeSettings) => {

				expect(settings).toEqual(settings);
				expect(settings._id).toEqual(fakeSettingsStorageLocation.key);
				expect(settings.setting_a).toEqual(newSettings.setting_a);
				expect(settings.setting_b).toEqual(newSettings.setting_b);
				expect(settings.setting_c).toEqual(newSettings.setting_c);
				expect(getCollectionSpy).toHaveBeenCalledTimes(2);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should upsert property of a FakeSettings object", (done: Function) => {

			// Given
			const settings = _.cloneDeep(fakeSettings);
			settings.sub_settings = {
				sub_setting_a: -1,
				sub_setting_b: -2,
				sub_setting_c: -3,
			};

			const promiseSettingsReady = desktopDataStore.getCollection(fakeSettingsStorageLocation.key).destroy().then(() => {
				desktopDataStore.elevateCollectionsMap.delete(fakeSettingsStorageLocation.key);
				getCollectionSpy.calls.reset();
				return desktopDataStore.getCollection(fakeSettingsStorageLocation.key).put(settings);
			});

			const newValue: number = 666;
			const updatePath = ["sub_settings", "sub_setting_b"];

			const expectedSaveSettings = _.cloneDeep(settings);
			expectedSaveSettings.sub_settings.sub_setting_b = newValue;

			// When
			const promise: Promise<FakeSettings> = promiseSettingsReady.then(() => {
				return <Promise<FakeSettings>>desktopDataStore.upsertProperty(fakeSettingsStorageLocation, updatePath, newValue, fakeSettings);
			});

			// Then
			promise.then((fakeSettings: FakeSettings) => {

				expect(fakeSettings._id).toEqual(fakeSettingsStorageLocation.key);
				expect(fakeSettings.setting_a).toEqual(expectedSaveSettings.setting_a);
				expect(fakeSettings.setting_b).toEqual(expectedSaveSettings.setting_b);
				expect(fakeSettings.setting_c).toEqual(expectedSaveSettings.setting_c);
				expect(fakeSettings.sub_settings.sub_setting_a).toEqual(expectedSaveSettings.sub_settings.sub_setting_a);
				expect(fakeSettings.sub_settings.sub_setting_b).toEqual(expectedSaveSettings.sub_settings.sub_setting_b);
				expect(fakeSettings.sub_settings.sub_setting_c).toEqual(expectedSaveSettings.sub_settings.sub_setting_c);

				desktopDataStore.elevateCollectionsMap.get(fakeSettingsStorageLocation.key).allDocs().then(result => {
					expect(result.total_rows).toEqual(1);
					done();
				});

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should clear FakeSettings object", (done: Function) => {

			// When
			const promise: Promise<void> = desktopDataStore.clear(fakeSettingsStorageLocation);

			// Then
			promise.then(() => {

				desktopDataStore.elevateCollectionsMap.get(fakeSettingsStorageLocation.key).allDocs().then(result => {
					expect(result.total_rows).toEqual(0);
					done();
				});
			});
		});
	});

});

