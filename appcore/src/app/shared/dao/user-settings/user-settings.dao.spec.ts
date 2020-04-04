import { TestBed } from "@angular/core/testing";
import { UserSettingsDao } from "./user-settings.dao";
import { DataStore } from "../../data-store/data-store";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";
import { UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

describe("UserSettingsDao", () => {

    let userSettingsDao: UserSettingsDao;

    beforeEach(done => {

        const mockedDataStore: MockedDataStore<UserSettingsModel> = new MockedDataStore();

        TestBed.configureTestingModule({
            providers: [
                UserSettingsDao,
                {provide: DataStore, useValue: mockedDataStore}
            ]
        });

        // Retrieve injected service
        userSettingsDao = TestBed.inject(UserSettingsDao);

        done();
    });

    it("should be created", done => {
        expect(userSettingsDao).toBeTruthy();
        done();
    });

});
