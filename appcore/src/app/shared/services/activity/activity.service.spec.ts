import { TestBed } from "@angular/core/testing";
import { ActivityService } from "./activity.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import _ from "lodash";
import {
  AthleteModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  DatedAthleteSettingsModel,
  Gender,
  SyncedActivityModel
} from "@elevate/shared/models";
import { FakeSyncedActivityHelper } from "../../../fitness-trend/shared/helpers/fake-synced-activity.helper";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { ElevateSport } from "@elevate/shared/enums";
import { DesktopModule } from "../../modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../electron/electron.service";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";

describe("ActivityService", () => {
  let activityService: ActivityService = null;

  let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, DesktopModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });

    const electronService: ElectronService = TestBed.inject(ElectronService);
    electronService.instance = {
      ipcRenderer: {}
    };

    const electronWindow = window as ElectronWindow;
    const electronRequire = (module: string) => {
      console.log("Loading module: " + module);
      return {};
    };
    electronWindow.require = electronRequire;
    spyOn(electronWindow, "require").and.callFake(electronRequire);

    _TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

    // Retrieve injected service
    activityService = TestBed.inject(ActivityService);

    done();
  });

  describe("CRUD operation support", () => {
    it("should be created", done => {
      expect(activityService).toBeTruthy();
      done();
    });

    it("should fetch activities", done => {
      // Given
      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(
        Promise.resolve(_TEST_SYNCED_ACTIVITIES_)
      );

      // When
      const promise: Promise<SyncedActivityModel[]> = activityService.fetch();

      // Then
      promise.then(
        (result: SyncedActivityModel[]) => {
          expect(result).not.toBeNull();
          expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
          expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
          expect(findDaoSpy).toHaveBeenCalledTimes(1);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });

    it("should clear SyncedActivityModels", done => {
      // Given
      const removeDaoSpy = spyOn(activityService.activityDao, "clear").and.returnValue(Promise.resolve(null));

      // When
      const promise: Promise<void> = activityService.clear();

      // Then
      promise.then(
        () => {
          expect(removeDaoSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });

    it("should remove SyncedActivityModel by activity ids", done => {
      // Given
      const activitiesToDelete = [
        302537043, // Chamrousse 1750
        296692980 // Fondo 100
      ];

      const removeByManyIdsSpy = spyOn(activityService.activityDao, "removeByManyIds").and.returnValue(
        Promise.resolve()
      );

      // When
      const promise = activityService.removeByManyIds(activitiesToDelete);

      // Then
      promise.then(
        () => {
          expect(removeByManyIdsSpy).toHaveBeenCalledWith(activitiesToDelete, true);
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });
  });

  describe("Activity compliance with athlete settings", () => {
    it("should resolve activities compliant with athlete settings", done => {
      // Given
      const athleteSnapshot = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );

      const athleteModel = new AthleteModel(Gender.MEN, [
        new DatedAthleteSettingsModel(null, athleteSnapshot.athleteSettings)
      ]);

      const syncedActivityModels: SyncedActivityModel[] = [];
      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          1,
          athleteSnapshot,
          "SuperHeartRateRide 01",
          ElevateSport.Ride,
          "2018-01-01",
          150,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          2,
          athleteSnapshot,
          "SuperHeartRateRide 02",
          ElevateSport.Ride,
          "2018-01-15",
          180,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          3,
          athleteSnapshot,
          "SuperHeartRateRide 03",
          ElevateSport.Ride,
          "2018-01-30",
          135,
          null,
          false
        )
      );

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(
        Promise.resolve(syncedActivityModels)
      );

      spyOn(activityService.athleteSnapshotResolver.athleteService, "fetch").and.returnValue(
        Promise.resolve(athleteModel)
      );

      // When
      const promise = activityService.isAthleteSettingsConsistent();

      // Then
      promise.then(
        (result: boolean) => {
          expect(findDaoSpy).toHaveBeenCalledTimes(1);
          expect(result).toBeTruthy();
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });

    it("should resolve activities compliant with athlete settings hasDatedAthleteSettings=true", done => {
      // Given
      const athleteSnapshot01 = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );

      const athleteSnapshot02 = _.cloneDeep(athleteSnapshot01);
      athleteSnapshot02.athleteSettings.maxHr = 211;
      athleteSnapshot02.athleteSettings.restHr = 66;
      athleteSnapshot02.athleteSettings.cyclingFtp = 250;

      const datedAthleteSettingsModels = [
        new DatedAthleteSettingsModel("2018-01-14", athleteSnapshot02.athleteSettings),
        new DatedAthleteSettingsModel(null, athleteSnapshot01.athleteSettings)
      ];

      const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettingsModels);

      const syncedActivityModels: SyncedActivityModel[] = [];
      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          1,
          athleteSnapshot01,
          "SuperHeartRateRide 01",
          ElevateSport.Ride,
          "2018-01-01",
          150,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          2,
          athleteSnapshot02,
          "SuperHeartRateRide 02",
          ElevateSport.Ride,
          "2018-01-15",
          180,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          3,
          athleteSnapshot02,
          "SuperHeartRateRide 03",
          ElevateSport.Ride,
          "2018-01-30",
          135,
          null,
          false
        )
      );

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(
        Promise.resolve(syncedActivityModels)
      );

      spyOn(activityService.athleteSnapshotResolver.athleteService, "fetch").and.returnValue(
        Promise.resolve(athleteModel)
      );

      // When
      const promise = activityService.isAthleteSettingsConsistent();

      // Then
      promise.then(
        (result: boolean) => {
          expect(findDaoSpy).toHaveBeenCalledTimes(1);
          expect(result).toBeTruthy();
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });

    it("should resolve non consistent activities ids which are not compliant athlete settings hasDatedAthleteSettings=true", done => {
      // Given
      const athleteModel01 = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );

      const athleteModel02 = _.cloneDeep(athleteModel01);
      athleteModel02.athleteSettings.maxHr = 211;
      athleteModel02.athleteSettings.restHr = 66;
      athleteModel02.athleteSettings.cyclingFtp = 250;

      const datedAthleteSettingsModels = [
        new DatedAthleteSettingsModel("2018-01-15", athleteModel02.athleteSettings),
        new DatedAthleteSettingsModel(null, athleteModel01.athleteSettings)
      ];

      const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettingsModels);

      const syncedActivityModels: SyncedActivityModel[] = [];
      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          1,
          athleteModel01,
          "SuperHeartRateRide 01",
          ElevateSport.Ride,
          "2018-01-01",
          150,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          2,
          athleteModel01,
          "SuperHeartRateRide 02",
          ElevateSport.Ride,
          "2018-01-15",
          180,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          3,
          athleteModel01,
          "SuperHeartRateRide 03",
          ElevateSport.Ride,
          "2018-01-30",
          135,
          null,
          false
        )
      );

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(
        Promise.resolve(syncedActivityModels)
      );

      spyOn(activityService.athleteSnapshotResolver.athleteService, "fetch").and.returnValue(
        Promise.resolve(athleteModel)
      );

      // When
      const promise = activityService.nonConsistentActivitiesWithAthleteSettings();

      // Then
      promise.then(
        (result: number[]) => {
          expect(findDaoSpy).toHaveBeenCalledTimes(1);

          expect(_.indexOf(result, 1)).toEqual(-1);
          expect(_.indexOf(result, 2)).not.toEqual(-1);
          expect(_.indexOf(result, 3)).not.toEqual(-1);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });

    it("should resolve activities NOT compliant with athlete settings", done => {
      // Given
      const athleteSnapshot = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );

      const syncedActivityModels: SyncedActivityModel[] = [];
      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          1,
          athleteSnapshot,
          "SuperHeartRateRide 01",
          ElevateSport.Ride,
          "2018-01-01",
          150,
          null,
          false
        )
      );

      const variousAthleteSnapshotModel = _.cloneDeep(athleteSnapshot);
      variousAthleteSnapshotModel.athleteSettings.maxHr = 666; // Introducing a little settings change
      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          2,
          variousAthleteSnapshotModel,
          "SuperHeartRateRide 02",
          ElevateSport.Ride,
          "2018-01-15",
          180,
          null,
          false
        )
      );

      syncedActivityModels.push(
        FakeSyncedActivityHelper.create(
          3,
          athleteSnapshot,
          "SuperHeartRateRide 03",
          ElevateSport.Ride,
          "2018-01-30",
          135,
          null,
          false
        )
      );

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(
        Promise.resolve(syncedActivityModels)
      );

      spyOn(activityService.athleteSnapshotResolver.athleteService, "fetch").and.returnValue(
        Promise.resolve(AthleteModel.DEFAULT_MODEL)
      );

      // When
      const promise = activityService.isAthleteSettingsConsistent();

      // Then
      promise.then(
        (result: boolean) => {
          expect(findDaoSpy).toHaveBeenCalledTimes(1);
          expect(result).toBeFalsy();
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
          done();
        }
      );
    });
  });
});
