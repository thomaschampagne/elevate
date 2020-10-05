import { TestBed } from "@angular/core/testing";
import { ConnectorSyncDateTimeDao } from "./connector-sync-date-time.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("ConnectorSyncDateTimeDao", () => {
    let connectorSyncDateTimeDao: ConnectorSyncDateTimeDao = null;

    beforeEach(done => {
        TestBed.configureTestingModule({
            providers: [
                ConnectorSyncDateTimeDao,
                { provide: DataStore, useClass: TestingDataStore },
                { provide: LoggerService, useClass: ConsoleLoggerService },
            ],
        });

        // Retrieve injected service
        connectorSyncDateTimeDao = TestBed.inject(ConnectorSyncDateTimeDao);
        done();
    });

    it("should be created", done => {
        expect(connectorSyncDateTimeDao).toBeTruthy();
        done();
    });
});
