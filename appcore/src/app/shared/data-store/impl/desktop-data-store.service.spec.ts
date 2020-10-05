import { TestBed } from "@angular/core/testing";

import { DesktopDataStore } from "./desktop-data-store.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("DesktopDataStore", () => {
    let service: DesktopDataStore<any>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DesktopDataStore,
                {provide: LoggerService, useClass: ConsoleLoggerService}
            ]
        });

        service = TestBed.inject(DesktopDataStore);

    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
