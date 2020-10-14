import { TestBed } from "@angular/core/testing";
import { StreamsDao } from "./streams.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";

describe("StreamsDao", () => {
  let streamsDao: StreamsDao;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StreamsDao,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: LoggerService, useClass: ConsoleLoggerService }
      ]
    });

    streamsDao = TestBed.inject(StreamsDao);
  });

  it("should be created", done => {
    expect(streamsDao).toBeTruthy();
    done();
  });
});
