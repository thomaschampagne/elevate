import { TestBed } from "@angular/core/testing";
import { PropertiesDao } from "./properties.dao";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";

describe("PropertiesDao", () => {
  let service: PropertiesDao;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PropertiesDao,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock },
        { provide: LoggerService, useClass: ConsoleLoggerService }
      ]
    });
    service = TestBed.inject(PropertiesDao);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
