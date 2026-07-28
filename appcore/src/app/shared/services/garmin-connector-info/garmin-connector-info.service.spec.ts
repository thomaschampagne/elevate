import { TestBed } from "@angular/core/testing";
import { CoreModule } from "../../../core/core.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/extension-target.module";
import { SharedModule } from "../../shared.module";
import { GarminConnectorInfoService } from "./garmin-connector-info.service";

describe("GarminConnectorInfoService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    })
  );

  it("should be created", () => {
    const service: GarminConnectorInfoService = TestBed.inject(GarminConnectorInfoService);
    expect(service).toBeTruthy();
  });
});
