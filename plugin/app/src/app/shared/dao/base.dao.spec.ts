import { TestBed } from "@angular/core/testing";

import { DataStore } from "../data-store/data-store";
import { StorageLocationModel } from "../data-store/storage-location.model";
import { Injectable } from "@angular/core";
import { AppStorageType } from "@elevate/shared/models";
import { MockedDataStore } from "../data-store/impl/spec/mocked-data-store.service";
import { BaseDao } from "./base.dao";

describe("BaseDao", () => {

	class Foo extends Object {
		bar: string;
	}

	@Injectable()
	class TestBaseDao extends BaseDao<Foo> {

		public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "foo");

		public init(): void {
			this.storageLocation = TestBaseDao.STORAGE_LOCATION;
		}
	}

	let baseDao: BaseDao<Foo>;
	let dataStore: DataStore<Foo>;

	let checkStorageLocationSpy: jasmine.Spy;
	let dataStoreFetchSpy: jasmine.Spy;
	let dataStoreSaveSpy: jasmine.Spy;
	let dataStoreSavePropertySpy: jasmine.Spy;
	let dataStoreClearSpy: jasmine.Spy;
	let mockedDataStore: MockedDataStore<Foo>;

	beforeEach((done: Function) => {

		mockedDataStore = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				{provide: BaseDao, useClass: TestBaseDao},
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		baseDao = TestBed.get(BaseDao);
		dataStore = TestBed.get(DataStore);

		checkStorageLocationSpy = spyOn(baseDao, "checkStorageLocation").and.callThrough();
		dataStoreFetchSpy = spyOn(dataStore, "fetch").and.callThrough();
		dataStoreSaveSpy = spyOn(dataStore, "save").and.callThrough();
		dataStoreSavePropertySpy = spyOn(dataStore, "saveProperty").and.callThrough();
		dataStoreClearSpy = spyOn(dataStore, "clear").and.callThrough();

		done();
	});

	it("should resolve StorageLocationModel provided", (done: Function) => {

		// Given, When
		const promise: Promise<void> = baseDao.checkStorageLocation();

		// Then
		promise.then(() => {
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should reject StorageLocationModel not provided", (done: Function) => {

		// Given
		baseDao.storageLocation = null; // Remove storage location

		// When
		const promise: Promise<void> = baseDao.checkStorageLocation();

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("StorageLocationModel not set in 'TestBaseDao'. Please override init method to assign a StorageLocationModel.");
			expect(dataStoreFetchSpy).not.toHaveBeenCalled();
			done();
		});
	});

	it("should fetch data", (done: Function) => {

		// Given,  When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> baseDao.fetch();

		// Then
		promise.then(() => {

			expect(checkStorageLocationSpy).toHaveBeenCalledTimes(1);
			expect(dataStoreFetchSpy).toHaveBeenCalledTimes(1);
			done();
		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save data", (done: Function) => {

		// Given
		const foo: Foo[] = [{
			bar: "john doe"
		}];

		// When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> baseDao.save(foo);

		// Then
		promise.then(() => {

			expect(checkStorageLocationSpy).toHaveBeenCalledTimes(1);
			expect(dataStoreSaveSpy).toHaveBeenCalledTimes(1);
			done();
		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should save property data", (done: Function) => {

		// Given
		mockedDataStore.setTypeObject();
		mockedDataStore.dataStore = {
			bar: "john doe"
		};

		const path = "bar";
		const newValue = "jack";

		// When
		const promise: Promise<Foo> = baseDao.saveProperty<string>(path, newValue);

		// Then
		promise.then(() => {

			expect(checkStorageLocationSpy).toHaveBeenCalledTimes(1);
			expect(dataStoreSavePropertySpy).toHaveBeenCalledTimes(1);
			done();
		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should clear data", (done: Function) => {

		// Given,  When
		const promise: Promise<Foo[]> = <Promise<Foo[]>> baseDao.clear();

		// Then
		promise.then(() => {

			expect(checkStorageLocationSpy).toHaveBeenCalledTimes(1);
			expect(dataStoreClearSpy).toHaveBeenCalledTimes(1);
			done();
		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
