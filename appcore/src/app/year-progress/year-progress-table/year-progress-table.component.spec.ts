import { ComponentFixture, TestBed } from "@angular/core/testing";
import { YearProgressTableComponent } from "./year-progress-table.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { YearProgressService } from "../shared/services/year-progress.service";
import moment from "moment";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { YearProgressActivitiesFixture } from "../shared/services/year-progress-activities.fixture";
import { ProgressAtDayModel } from "../shared/models/progress-at-date.model";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import { DeltaType } from "./models/delta-type.enum";
import { YearProgressModule } from "../year-progress.module";
import { YearToDateProgressConfigModel } from "../shared/models/year-to-date-progress-config.model";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";

describe("YearProgressTableComponent", () => {
  const isMetric = true;
  let component: YearProgressTableComponent;
  let fixture: ComponentFixture<YearProgressTableComponent>;
  let yearProgressService: YearProgressService;
  let activities: Activity[];

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, YearProgressModule],
      providers: [
        YearProgressService,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();

    yearProgressService = TestBed.inject(YearProgressService);

    done();
  });

  beforeEach(done => {
    activities = YearProgressActivitiesFixture.provide();

    fixture = TestBed.createComponent(YearProgressTableComponent);
    component = fixture.componentInstance;

    component.currentYear = 2018;
    component.momentWatched = moment().year(component.currentYear);
    component.progressConfig = new YearToDateProgressConfigModel(
      [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
      true,
      true
    );

    // Inject fake progression
    const progressConfig = new YearToDateProgressConfigModel(
      [ElevateSport.Ride, ElevateSport.VirtualRide, ElevateSport.Run],
      true,
      true
    );

    component.yearProgressions = yearProgressService.progressions(progressConfig, isMetric, activities);

    // Inject selected years (here all from activities)
    component.selectedYears = yearProgressService.availableYears(activities);

    // Inject progress type
    component.selectedProgressType = new YearProgressTypeModel(
      ProgressType.DISTANCE,
      "Distance",
      isMetric ? "kilometers" : "miles",
      isMetric ? "km" : "mi"
    );

    // Inject style
    const colors: string[] = ["red", "blue", "green", "purple"];

    const yearsColorsMap = new Map<number, string>();
    yearsColorsMap.set(2015, "red");
    yearsColorsMap.set(2016, "blue");
    yearsColorsMap.set(2017, "green");
    yearsColorsMap.set(2018, "purple");

    component.yearProgressStyleModel = new YearProgressStyleModel(yearsColorsMap, colors);

    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should provide proper year progressions time rows between two years (1)", done => {
    // Given
    const dayMoment = moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm");

    const hoursFirstYear = 24;
    const firstYear: ProgressAtDayModel = {
      date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2017,
      progressType: ProgressType.TIME,
      value: hoursFirstYear,
      color: null
    };

    const hoursSecondYear = 36;
    const secondYear: ProgressAtDayModel = {
      date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2016,
      progressType: ProgressType.TIME,
      value: hoursSecondYear,
      color: null
    };

    const targetHours = 31;
    const targetProgressModel = {
      dayOfYear: dayMoment.dayOfYear(),
      value: targetHours
    };

    component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

    // When
    const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear], targetProgressModel);

    // Then
    expect(progressionRows).not.toBeNull();

    const firstRow = progressionRows[0];
    expect(firstRow.year).toEqual(2017);
    expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
    expect(firstRow.progressTypeLabel).toEqual("Time");
    expect(firstRow.progressTypeUnit).toEqual("h");
    expect(firstRow.currentValue).toEqual(hoursFirstYear);
    expect(firstRow.deltaPreviousYear.value).toEqual(Math.abs(hoursFirstYear - hoursSecondYear));
    expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.NEGATIVE);
    expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
    expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.NEGATIVE.toString());
    expect(firstRow.deltaTarget.value).toEqual(Math.abs(hoursFirstYear - targetHours));
    expect(firstRow.deltaTarget.type).toEqual(DeltaType.NEGATIVE);
    expect(firstRow.deltaTarget.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_NEGATIVE);
    expect(firstRow.deltaTarget.class).toEqual(DeltaType.NEGATIVE.toString());

    const secondRow = progressionRows[1];
    expect(secondRow.year).toEqual(2016);
    expect(secondRow.deltaPreviousYear.date).toEqual(null);
    expect(secondRow.progressTypeLabel).toEqual("Time");
    expect(secondRow.progressTypeUnit).toEqual("h");
    expect(secondRow.currentValue).toEqual(hoursSecondYear);
    expect(secondRow.deltaPreviousYear.value).toEqual(null);
    expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
    expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
    expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
    expect(secondRow.deltaTarget.value).toEqual(Math.abs(hoursSecondYear - targetHours));
    expect(secondRow.deltaTarget.type).toEqual(DeltaType.POSITIVE);
    expect(secondRow.deltaTarget.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
    expect(secondRow.deltaTarget.class).toEqual(DeltaType.POSITIVE.toString());
    done();
  });

  it("should provide proper year progressions time rows when no delta between two years (2)", done => {
    // Given
    const hoursFirstYear = 24;
    const firstYear: ProgressAtDayModel = {
      date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2017,
      progressType: ProgressType.TIME,
      value: hoursFirstYear,
      color: null
    };

    const hoursSecondYear = 24;
    const secondYear: ProgressAtDayModel = {
      date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2016,
      progressType: ProgressType.TIME,
      value: hoursSecondYear,
      color: null
    };

    component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

    // When
    const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear], null);

    // Then
    expect(progressionRows).not.toBeNull();

    const firstRow = progressionRows[0];
    expect(firstRow.year).toEqual(2017);
    expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
    expect(firstRow.progressTypeLabel).toEqual("Time");
    expect(firstRow.progressTypeUnit).toEqual("h");
    expect(firstRow.currentValue).toEqual(hoursFirstYear);
    expect(firstRow.deltaPreviousYear.value).toEqual(0);
    expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.UNSIGNED);
    expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
    expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.UNSIGNED.toString());

    const secondRow = progressionRows[1];
    expect(secondRow.year).toEqual(2016);
    expect(secondRow.deltaPreviousYear.date).toEqual(null);
    expect(secondRow.progressTypeLabel).toEqual("Time");
    expect(secondRow.progressTypeUnit).toEqual("h");
    expect(secondRow.currentValue).toEqual(hoursSecondYear);
    expect(secondRow.deltaPreviousYear.value).toEqual(null);
    expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
    expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
    expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
    done();
  });

  it("should provide proper year progressions time rows when no delta between two years (3)", done => {
    // Given
    const hoursFirstYear = 24;
    const firstYear: ProgressAtDayModel = {
      date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2017,
      progressType: ProgressType.TIME,
      value: hoursFirstYear,
      color: null
    };

    const hoursSecondYear = 0;
    const secondYear: ProgressAtDayModel = {
      date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2016,
      progressType: ProgressType.TIME,
      value: hoursSecondYear,
      color: null
    };

    component.selectedProgressType = new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h");

    // When
    const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear], null);

    // Then
    expect(progressionRows).not.toBeNull();

    const firstRow = progressionRows[0];
    expect(firstRow.year).toEqual(2017);
    expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
    expect(firstRow.progressTypeLabel).toEqual("Time");
    expect(firstRow.progressTypeUnit).toEqual("h");
    expect(firstRow.currentValue).toEqual(hoursFirstYear);
    expect(firstRow.deltaPreviousYear.value).toEqual(24);
    expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.POSITIVE);
    expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_POSITIVE);
    expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.POSITIVE.toString());

    const secondRow = progressionRows[1];
    expect(secondRow.year).toEqual(2016);
    expect(secondRow.deltaPreviousYear.date).toEqual(null);
    expect(secondRow.progressTypeLabel).toEqual("Time");
    expect(secondRow.progressTypeUnit).toEqual("h");
    expect(secondRow.currentValue).toEqual(hoursSecondYear);
    expect(secondRow.deltaPreviousYear.value).toEqual(null);
    expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
    expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
    expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
    done();
  });

  it("should provide proper year progressions elevation rows when no delta between two years", done => {
    // Given
    const firstYear: ProgressAtDayModel = {
      date: moment("2017-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2017,
      progressType: ProgressType.ELEVATION,
      value: 25000,
      color: null
    };

    const secondYear: ProgressAtDayModel = {
      date: moment("2016-08-15 12:00", "YYYY-MM-DD hh:mm").toDate(),
      year: 2016,
      progressType: ProgressType.ELEVATION,
      value: 25000,
      color: null
    };

    component.selectedProgressType = new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", "feet", "ft");

    // When
    const progressionRows: ProgressionAtDayRow[] = component.rows([firstYear, secondYear], null);

    // Then
    expect(progressionRows).not.toBeNull();

    const firstRow = progressionRows[0];
    expect(firstRow.year).toEqual(2017);
    expect(firstRow.deltaPreviousYear.date).toEqual("August 15, 2016");
    expect(firstRow.progressTypeLabel).toEqual("Elevation");
    expect(firstRow.progressTypeUnit).toEqual("ft");
    expect(firstRow.currentValue).toEqual(25000);
    expect(firstRow.deltaPreviousYear.value).toEqual(0);
    expect(firstRow.deltaPreviousYear.type).toEqual(DeltaType.UNSIGNED);
    expect(firstRow.deltaPreviousYear.signSymbol).toEqual(YearProgressTableComponent.DELTA_SIGN_UNSIGNED);
    expect(firstRow.deltaPreviousYear.class).toEqual(DeltaType.UNSIGNED.toString());

    const secondRow = progressionRows[1];
    expect(secondRow.year).toEqual(2016);
    expect(secondRow.deltaPreviousYear.date).toEqual(null);
    expect(secondRow.progressTypeLabel).toEqual("Elevation");
    expect(secondRow.progressTypeUnit).toEqual("ft");
    expect(secondRow.currentValue).toEqual(25000);
    expect(secondRow.deltaPreviousYear.value).toEqual(null);
    expect(secondRow.deltaPreviousYear.type).toEqual(DeltaType.NAN);
    expect(secondRow.deltaPreviousYear.signSymbol).toEqual(null);
    expect(secondRow.deltaPreviousYear.class).toEqual(DeltaType.NAN.toString());
    done();
  });
});
