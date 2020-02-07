import { TestBed } from "@angular/core/testing";

import { StreamsDao } from "./streams.dao";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";
import { CompressedStreamModel } from "@elevate/shared/models";

describe("StreamsDaoService", () => {

	let streamsDao: StreamsDao;

	beforeEach(() => {
		const mockedDataStore: MockedDataStore<CompressedStreamModel> = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				StreamsDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		streamsDao = TestBed.get(StreamsDao);
	});

	it("should be created", (done: Function) => {
		expect(streamsDao).toBeTruthy();
		done();
	});
});
