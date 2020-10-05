import { TestBed } from "@angular/core/testing";
import { UserSettingsDao } from "./user-settings.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("UserSettingsDao", () => {
    let userSettingsDao: UserSettingsDao;

    beforeEach(done => {
        TestBed.configureTestingModule({
            providers: [
                UserSettingsDao,
                { provide: DataStore, useClass: TestingDataStore },
                { provide: LoggerService, useClass: ConsoleLoggerService },
            ],
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
