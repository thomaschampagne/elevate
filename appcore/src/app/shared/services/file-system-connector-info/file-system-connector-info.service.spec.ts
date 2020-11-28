import { TestBed } from "@angular/core/testing";

import { FileSystemConnectorInfoService } from "./file-system-connector-info.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";

describe("FileSystemConnectorInfoService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    })
  );

  it("should be created", () => {
    const service: FileSystemConnectorInfoService = TestBed.inject(FileSystemConnectorInfoService);
    expect(service).toBeTruthy();
  });
});
