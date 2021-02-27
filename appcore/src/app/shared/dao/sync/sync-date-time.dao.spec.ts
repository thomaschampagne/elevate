import { TestBed } from "@angular/core/testing";

import { SyncDateTimeDao } from "./sync-date-time.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";

describe("SyncDateTimeDao", () => {
  let syncDateTimeDao: SyncDateTimeDao = null;

  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [
        SyncDateTimeDao,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock },
        { provide: LoggerService, useClass: ConsoleLoggerService }
      ]
    });

    // Retrieve injected service
    syncDateTimeDao = TestBed.inject(SyncDateTimeDao);
    done();
  });

  it("should be created", done => {
    expect(syncDateTimeDao).toBeTruthy();
    done();
  });
});
