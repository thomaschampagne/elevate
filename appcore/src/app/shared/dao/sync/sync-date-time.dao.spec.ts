import { TestBed } from "@angular/core/testing";

import { SyncDateTimeDao } from "./sync-date-time-dao.service";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";


describe("SyncDateTimeDao", () => {

	let syncDateTimeDao: SyncDateTimeDao = null;

	beforeEach((done: Function) => {

		const lastSyncTime = Date.now();
		const mockedDataStore: MockedDataStore<number> = new MockedDataStore(lastSyncTime);

		TestBed.configureTestingModule({
			providers: [
				SyncDateTimeDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		syncDateTimeDao = TestBed.get(SyncDateTimeDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(syncDateTimeDao).toBeTruthy();
		done();
	});

});
