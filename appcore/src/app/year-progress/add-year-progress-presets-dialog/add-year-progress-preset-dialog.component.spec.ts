import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddYearProgressPresetDialogComponent } from "./add-year-progress-preset-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AddYearToDateProgressPresetDialogData } from "../shared/models/add-year-to-date-progress-preset-dialog-data";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { ElevateSport } from "@elevate/shared/enums";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";

describe("AddYearProgressPresetDialogComponent", () => {
  let component: AddYearProgressPresetDialogComponent;
  let fixture: ComponentFixture<AddYearProgressPresetDialogComponent>;

  beforeEach(done => {
    const addYearProgressPresetsDialogData: AddYearToDateProgressPresetDialogData = new AddYearToDateProgressPresetDialogData(
      new YearProgressTypeModel(ProgressType.DISTANCE, "Distance"),
      [ElevateSport.Ride, ElevateSport.VirtualRide],
      true,
      true,
      5000
    );

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, YearProgressModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: MAT_DIALOG_DATA, useValue: addYearProgressPresetsDialogData },
        { provide: MatDialogRef, useValue: {} }
      ]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(AddYearProgressPresetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
