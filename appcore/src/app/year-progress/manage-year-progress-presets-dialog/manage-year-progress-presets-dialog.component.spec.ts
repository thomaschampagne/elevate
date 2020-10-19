import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { YearToDateProgressPresetModel } from "../shared/models/year-to-date-progress-preset.model";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { ElevateSport } from "@elevate/shared/enums";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";

describe("ManageYearProgressPresetsDialogComponent", () => {
  const yearProgressPresetModels = [
    new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false, 750),
    new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false),
    new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], false, false, 30000)
  ];

  let component: ManageYearProgressPresetsDialogComponent;
  let fixture: ComponentFixture<ManageYearProgressPresetsDialogComponent>;

  beforeEach(done => {
    const isMetric = true;
    const yearProgressTypeModels: YearProgressTypeModel[] = YearProgressService.provideProgressTypes(isMetric);

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, YearProgressModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: yearProgressTypeModels
        },
        {
          provide: MatDialogRef,
          useValue: {}
        },
        {
          provide: DataStore,
          useClass: TestingDataStore
        }
      ]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(ManageYearProgressPresetsDialogComponent);
    component = fixture.componentInstance;
    spyOn(component.yearProgressService, "fetchPresets").and.returnValue(Promise.resolve(yearProgressPresetModels));
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
