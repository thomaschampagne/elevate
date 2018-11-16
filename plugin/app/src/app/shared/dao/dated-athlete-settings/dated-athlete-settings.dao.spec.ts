import { TestBed } from "@angular/core/testing";
import { DatedAthleteSettingsDao } from "./dated-athlete-settings.dao";
import { MockedDataStore } from "../../data-store/impl/spec/mocked-data-store.service";
import { SyncedActivityModel } from "@elevate/shared/models";
import { DataStore } from "../../data-store/data-store";

describe("DatedAthleteSettingsDao", () => {

	let datedAthleteSettingsDao: DatedAthleteSettingsDao;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<SyncedActivityModel> = new MockedDataStore([]);

		TestBed.configureTestingModule({
			providers: [
				DatedAthleteSettingsDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		datedAthleteSettingsDao = TestBed.get(DatedAthleteSettingsDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(datedAthleteSettingsDao).toBeTruthy();
		done();
	});

});
