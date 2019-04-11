import { TestBed } from "@angular/core/testing";
import { AthleteDao } from "./athlete-dao.service";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { SyncedActivityModel } from "@elevate/shared/models";
import { DataStore } from "../../data-store/data-store";

describe("AthleteDao", () => {

	let athleteDao: AthleteDao;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<SyncedActivityModel> = new MockedDataStore([]);

		TestBed.configureTestingModule({
			providers: [
				AthleteDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		athleteDao = TestBed.get(AthleteDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(athleteDao).toBeTruthy();
		done();
	});

});
