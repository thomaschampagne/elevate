import { TestBed } from "@angular/core/testing";
import { GarminConnectorInfoService } from "./garmin-connector-info.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";

describe("GarminConnectorInfoService", () => {
  let service: GarminConnectorInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });
    service = TestBed.inject(GarminConnectorInfoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should tell when connector is configured", () => {
    expect(service.isConfigured(null)).toEqual(false);
    expect(service.isConfigured(new GarminConnectorInfo(null))).toEqual(false);
    expect(service.isConfigured(new GarminConnectorInfo("   "))).toEqual(false);
    expect(service.isConfigured(new GarminConnectorInfo("my-key"))).toEqual(true);
  });

  it("should save and fetch the api key", done => {
    service
      .fetch()
      .then(info => {
        expect(info.apiKey).toBeNull();
        info.apiKey = "my-key";
        return service.update(info);
      })
      .then(() => service.fetch())
      .then(info => {
        expect(info.apiKey).toEqual("my-key");
        done();
      });
  });
});
