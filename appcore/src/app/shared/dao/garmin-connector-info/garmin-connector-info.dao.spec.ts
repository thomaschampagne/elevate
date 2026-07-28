import { CoreModule } from "../../../core/core.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/extension-target.module";
import { SharedModule } from "../../shared.module";
import { GarminConnectorInfoDao } from "./garmin-connector-info.dao";
import { TestBed } from "@angular/core/testing";

describe("GarminConnectorInfoDao", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });
  });

  it("should be created", () => {
    const service: GarminConnectorInfoDao = TestBed.inject(GarminConnectorInfoDao);
    expect(service).toBeTruthy();
  });
});
