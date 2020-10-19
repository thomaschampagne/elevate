import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StravaConnectorComponent } from "./strava-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";

describe("StravaConnectorComponent", () => {
  let component: StravaConnectorComponent;
  let fixture: ComponentFixture<StravaConnectorComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();
    done();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StravaConnectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
