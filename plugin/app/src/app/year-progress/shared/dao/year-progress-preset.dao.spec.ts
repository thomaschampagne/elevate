import { TestBed } from "@angular/core/testing";
import { YearProgressPresetDao } from "./year-progress-preset.dao";
import { MockedDataStore } from "../../../shared/data-store/impl/spec/mocked-data-store.service";
import { YearToDateProgressPresetModel } from "../models/year-to-date-progress-preset.model";
import { DataStore } from "../../../shared/data-store/data-store";

describe("YearProgressPresetDao", () => {

	let yearProgressPresetDao: YearProgressPresetDao;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<YearToDateProgressPresetModel> = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				YearProgressPresetDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		yearProgressPresetDao = TestBed.get(YearProgressPresetDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(yearProgressPresetDao).toBeTruthy();
		done();
	});

});
