import { TestBed } from "@angular/core/testing";

import { StreamsDao } from "./streams.dao";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { DataStore } from "../../data-store/data-store";
import { CompressedStreamModel } from "@elevate/shared/models";
import * as _ from "lodash";

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


	it("should remove CompressedStreamModel by activity ids", (done: Function) => {

		// Given
		const streamsToDelete = [
			"003",
			"007"
		];

		const compressedStreamModels = [
			new CompressedStreamModel("001", null),
			new CompressedStreamModel("002", null),
			new CompressedStreamModel("003", null),
			new CompressedStreamModel("004", null),
			new CompressedStreamModel("005", null),
			new CompressedStreamModel("006", null),
			new CompressedStreamModel("007", null),
			new CompressedStreamModel("008", null),
		];
		spyOn(streamsDao, "fetch").and.returnValue(Promise.resolve(compressedStreamModels));

		// When
		const promise: Promise<CompressedStreamModel[]> = streamsDao.removeByIds(streamsToDelete);

		// Then
		promise.then((result: CompressedStreamModel[]) => {

			expect(result.length).toEqual(compressedStreamModels.length - streamsToDelete.length);

			let compressedStreams = _.find(result, {activityId: streamsToDelete[0]});
			expect(_.isEmpty(compressedStreams)).toBeTruthy();

			compressedStreams = _.find(result, {activityId: streamsToDelete[1]});
			expect(_.isEmpty(compressedStreams)).toBeTruthy();

			compressedStreams = _.find(result, {activityId: "002"});
			expect(_.isEmpty(compressedStreams)).toBeFalsy();

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});
});
