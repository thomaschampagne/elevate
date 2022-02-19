import { TestBed } from "@angular/core/testing";
import { StravaConnectorInfoService } from "./strava-connector-info.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";

describe("StravaConnectorInfoService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    })
  );

  it("should be created", () => {
    const service: StravaConnectorInfoService = TestBed.inject(StravaConnectorInfoService);
    expect(service).toBeTruthy();
  });
});
