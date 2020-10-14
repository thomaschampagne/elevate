import { TestBed } from "@angular/core/testing";

import { StravaConnectorInfoDao } from "./strava-connector-info.dao";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DesktopModule } from "../../modules/desktop/desktop.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";

describe("StravaConnectorInfoDao", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, DesktopModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });
  });

  it("should be created", () => {
    const service: StravaConnectorInfoDao = TestBed.inject(StravaConnectorInfoDao);
    expect(service).toBeTruthy();
  });
});
