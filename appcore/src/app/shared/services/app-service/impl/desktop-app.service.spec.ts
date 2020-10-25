import { TestBed } from "@angular/core/testing";

import { DesktopAppService } from "./desktop-app.service";
import { SharedModule } from "../../../shared.module";
import { TargetModule } from "../../../modules/target/desktop-target.module";
import { TargetBootModule } from "../../../../boot/desktop-boot.module";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { LoggerService } from "../../logging/logger.service";
import { ConsoleLoggerService } from "../../logging/console-logger.service";

describe("DesktopAppService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SharedModule, TargetModule, TargetBootModule],
      providers: [
        DesktopAppService,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: LoggerService, useClass: ConsoleLoggerService }
      ]
    })
  );

  it("should be created", () => {
    const service: DesktopAppService = TestBed.inject(DesktopAppService);
    expect(service).toBeTruthy();
  });
});
