import { TestBed } from "@angular/core/testing";
import { UserSettingsDao } from "./user-settings.dao";
import { DataStore } from "../../data-store/data-store";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

describe("UserSettingsDao", () => {

	let userSettingsDao: UserSettingsDao;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<UserSettingsModel> = new MockedDataStore();

		TestBed.configureTestingModule({
			providers: [
				UserSettingsDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		userSettingsDao = TestBed.get(UserSettingsDao);

		done();
	});

	it("should be created", (done: Function) => {
		expect(userSettingsDao).toBeTruthy();
		done();
	});

});
