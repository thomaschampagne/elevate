import { TestBed } from "@angular/core/testing";

import { LastSyncDateTimeDao } from "./last-sync-date-time.dao";
import { MockedDataStore } from "../../data-store/impl/spec/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";


describe("LastSyncDateTimeDao", () => {

	let lastSyncDateTimeDao: LastSyncDateTimeDao = null;

	beforeEach((done: Function) => {

		const lastSyncTime = Date.now();
		const mockedDataStore: MockedDataStore<number> = new MockedDataStore(lastSyncTime);

		TestBed.configureTestingModule({
			providers: [
				LastSyncDateTimeDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		lastSyncDateTimeDao = TestBed.get(LastSyncDateTimeDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(lastSyncDateTimeDao).toBeTruthy();
		done();
	});

});
