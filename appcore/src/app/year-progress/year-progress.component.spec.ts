import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressComponent } from "./year-progress.component";
import { SharedModule } from "../shared/shared.module";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { CoreModule } from "../core/core.module";
import { YearProgressStyleModel } from "./year-progress-graph/models/year-progress-style.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { SyncService } from "../shared/services/sync/sync.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { YearProgressActivitiesFixture } from "./shared/services/year-progress-activities.fixture";
import { SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { YearProgressModule } from "./year-progress.module";
import { YearToDateProgressPresetModel } from "./shared/models/year-to-date-progress-preset.model";
import { ProgressType } from "./shared/enums/progress-type.enum";
import { ExtensionEventsService } from "../shared/services/external-updates/impl/extension-events.service";
import { ElevateSport } from "@elevate/shared/enums";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("YearProgressComponent", () => {
  const pluginId = "c061d18abea0";
  const yearProgressPresetModels = [
    new YearToDateProgressPresetModel(ProgressType.DISTANCE, [ElevateSport.Run], false, false, 750),
    new YearToDateProgressPresetModel(ProgressType.COUNT, [ElevateSport.VirtualRide], false, false),
    new YearToDateProgressPresetModel(ProgressType.ELEVATION, [ElevateSport.Ride], false, false, 30000)
  ];

  let component: YearProgressComponent;
  let fixture: ComponentFixture<YearProgressComponent>;

  let syncService: SyncService<any>;
  let userSettingsService: UserSettingsService;
  let activityDao: ActivityDao;
  let TEST_SYNCED_ACTIVITIES: SyncedActivityModel[];

  beforeEach(done => {
    spyOn(ExtensionEventsService, "getBrowserExternalMessages").and.returnValue({
      // @ts-ignore
      addListener: (message: any, sender: any, sendResponse: any) => {}
    });

    spyOn(ExtensionEventsService, "getBrowserPluginId").and.returnValue(pluginId);

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, YearProgressModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();

    TEST_SYNCED_ACTIVITIES = YearProgressActivitiesFixture.provide();
    syncService = TestBed.inject(SyncService);
    userSettingsService = TestBed.inject(UserSettingsService);
    activityDao = TestBed.inject(ActivityDao);

    spyOn(syncService, "getSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
    spyOn(syncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));
    spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(DesktopUserSettingsModel.DEFAULT_MODEL));
    spyOn(activityDao, "find").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(YearProgressComponent);
    component = fixture.componentInstance;
    spyOn(component.yearProgressService, "fetchPresets").and.returnValue(Promise.resolve(yearProgressPresetModels));
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should determine most performed activity type", done => {
    // Given
    const expected = ElevateSport.Ride;
    const activitiesCountByTypeModels: ActivityCountByTypeModel[] = [
      { type: ElevateSport.AlpineSki, count: 12 },
      { type: ElevateSport.Ride, count: 522 },
      { type: ElevateSport.Run, count: 25 },
      { type: ElevateSport.Walk, count: 32 },
      { type: ElevateSport.Hike, count: 8 },
      { type: ElevateSport.Swim, count: 5 },
      { type: ElevateSport.VirtualRide, count: 29 },
      { type: ElevateSport.InlineSkate, count: 3 },
      { type: ElevateSport.Workout, count: 6 }
    ];

    // When
    const mostPerformedType = YearProgressComponent.findMostPerformedActivityType(activitiesCountByTypeModels);

    // Then
    expect(mostPerformedType).toEqual(expected);
    done();
  });

  it("should give proper colors to all year lines from a color palette", done => {
    // Given
    const colorPalette: string[] = ["red", "blue", "green", "purple", "orange"];
    const expectedGlobalColors: string[] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

    const yearProgressions: YearProgressModel[] = [
      new YearProgressModel(2011, []),
      new YearProgressModel(2012, []),
      new YearProgressModel(2013, []),
      new YearProgressModel(2014, []),
      new YearProgressModel(2015, []),
      new YearProgressModel(2016, []),
      new YearProgressModel(2017, [])
    ];

    // When
    const style: YearProgressStyleModel = component.styleFromPalette(yearProgressions, colorPalette);

    // Then
    expect(style.colors).toEqual(expectedGlobalColors);

    expect(style.yearsColorsMap.get(2011)).toEqual("red");
    expect(style.yearsColorsMap.get(2012)).toEqual("blue");
    expect(style.yearsColorsMap.get(2013)).toEqual("green");
    expect(style.yearsColorsMap.get(2014)).toEqual("purple");
    expect(style.yearsColorsMap.get(2015)).toEqual("orange");
    expect(style.yearsColorsMap.get(2016)).toEqual("red");
    expect(style.yearsColorsMap.get(2017)).toEqual("blue");
    done();
  });
});
