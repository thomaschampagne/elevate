import { TestBed } from "@angular/core/testing";
import { GarminConnectorInfoDao } from "./garmin-connector-info.dao";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";

describe("GarminConnectorInfoDao", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });
  });

  it("should be created", () => {
    const dao: GarminConnectorInfoDao = TestBed.inject(GarminConnectorInfoDao);
    expect(dao).toBeTruthy();
  });

  it("should provide a fresh not configured default value", () => {
    const dao: GarminConnectorInfoDao = TestBed.inject(GarminConnectorInfoDao);
    const first = dao.getDefaultStorageValue();
    const second = dao.getDefaultStorageValue();
    expect(first.apiKey).toBeNull();
    expect(first.updateExistingNamesTypes).toEqual(true);
    expect(first).not.toBe(second);
  });
});
