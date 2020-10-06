import { TestBed } from "@angular/core/testing";
import { YearProgressPresetDao } from "./year-progress-preset.dao";
import { DataStore } from "../../../shared/data-store/data-store";
import { TestingDataStore } from "../../../shared/data-store/testing-datastore.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { ConsoleLoggerService } from "../../../shared/services/logging/console-logger.service";

describe("YearProgressPresetDao", () => {
  let yearProgressPresetDao: YearProgressPresetDao;

  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [
        YearProgressPresetDao,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: LoggerService, useClass: ConsoleLoggerService },
      ],
    });

    yearProgressPresetDao = TestBed.inject(YearProgressPresetDao);
    done();
  });

  it("should be created", done => {
    expect(yearProgressPresetDao).toBeTruthy();
    done();
  });
});
