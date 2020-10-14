import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressGraphComponent } from "./year-progress-graph.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import moment from "moment";
import { YearProgressService } from "../shared/services/year-progress.service";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressStyleModel } from "./models/year-progress-style.model";
import { SyncedActivityModel } from "@elevate/shared/models";
import { YearProgressModule } from "../year-progress.module";
import { YearToDateProgressConfigModel } from "../shared/models/year-to-date-progress-config.model";
import { ElevateSport } from "@elevate/shared/enums";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";

describe("YearProgressGraphComponent", () => {
  const isMetric = true;
  let component: YearProgressGraphComponent;
  let fixture: ComponentFixture<YearProgressGraphComponent>;
  let yearProgressService: YearProgressService;
  let syncedActivityModels: SyncedActivityModel[];

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, YearProgressModule],
      providers: [YearProgressService, { provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();

    yearProgressService = TestBed.inject(YearProgressService);

    done();
  });

  beforeEach(done => {
    syncedActivityModels = YearProgressActivitiesFixture.provide();

    fixture = TestBed.createComponent(YearProgressGraphComponent);
    component = fixture.componentInstance;

    // Inject today
    yearProgressService.momentWatched = moment();

    // Inject fake progression
    const progressConfig = new YearToDateProgressConfigModel(
      [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
      true,
      true
    );

    component.yearProgressions = yearProgressService.progressions(progressConfig, isMetric, syncedActivityModels);

    // Inject selected years (here all from syncedActivityModels)
    component.selectedYears = yearProgressService.availableYears(syncedActivityModels);

    // Inject progress type
    component.selectedProgressType = new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", "km");

    // Inject style
    const colors: string[] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

    const yearsColorsMap = new Map<number, string>();
    yearsColorsMap.set(2011, "red");
    yearsColorsMap.set(2012, "blue");
    yearsColorsMap.set(2013, "green");
    yearsColorsMap.set(2014, "purple");
    yearsColorsMap.set(2015, "orange");
    yearsColorsMap.set(2016, "red");
    yearsColorsMap.set(2017, "blue");

    component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

    fixture.detectChanges();

    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should give proper restricted colors from a year selection", done => {
    // Given
    const yearSelection: number[] = [2017, 2016, 2013];

    const expectedYearSelectedColors: string[] = [
      component.yearProgressStyleModel.yearsColorsMap.get(2013),
      component.yearProgressStyleModel.yearsColorsMap.get(2016),
      component.yearProgressStyleModel.yearsColorsMap.get(2017)
    ];

    // When
    const yearSelectedColors: string[] = component.colorsOfSelectedYears(yearSelection);

    // Then
    expect(yearSelectedColors).toEqual(expectedYearSelectedColors);
    done();
  });
});
