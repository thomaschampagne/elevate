import { TestBed } from "@angular/core/testing";
import { AthleteDao } from "./athlete.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("AthleteDao", () => {
  let athleteDao: AthleteDao;

  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [
        AthleteDao,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: LoggerService, useClass: ConsoleLoggerService },
      ],
    });

    // Retrieve injected service
    athleteDao = TestBed.inject(AthleteDao);
    done();
  });

  it("should be created", done => {
    expect(athleteDao).toBeTruthy();
    done();
  });
});
