import { TestBed } from "@angular/core/testing";

import { PropertiesDao } from "./properties.dao";
import { AthleteDao } from "../athlete/athlete.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("PropertiesDao", () => {
    let service: PropertiesDao;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PropertiesDao,
                {provide: DataStore, useClass: TestingDataStore},
                {provide: LoggerService, useClass: ConsoleLoggerService}
            ]
        });
        service = TestBed.inject(PropertiesDao);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
