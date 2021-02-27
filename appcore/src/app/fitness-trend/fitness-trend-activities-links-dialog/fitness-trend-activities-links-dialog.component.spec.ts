import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendActivitiesLinksDialogComponent } from "./fitness-trend-activities-links-dialog.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { DayStressModel } from "../shared/models/day-stress.model";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";

describe("FitnessTrendActivitiesLinksDialogComponent", () => {
  let component: FitnessTrendActivitiesLinksDialogComponent;
  let fixture: ComponentFixture<FitnessTrendActivitiesLinksDialogComponent>;

  const dayFitnessTrendModel: DayFitnessTrendModel = new DayFitnessTrendModel(
    new DayStressModel(new Date(), false),
    0,
    0,
    0
  );

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, FitnessTrendModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: dayFitnessTrendModel
        },
        {
          provide: MatDialogRef,
          useValue: {}
        },
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();
    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(FitnessTrendActivitiesLinksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
