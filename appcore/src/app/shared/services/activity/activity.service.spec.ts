import { ActivityService } from "./activity.service";
import { TestBed } from "@angular/core/testing";
import { FakeActivityHelper } from "../../../fitness-trend/shared/helpers/fake-activity.helper";
import { SharedModule } from "../../shared.module";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { DataStore } from "../../data-store/data-store";
import ACTIVITIES_FIXTURES from "../../../../shared-fixtures/activities-2015.fixture.json";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { CoreModule } from "../../../core/core.module";
import _ from "lodash";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";

describe("ActivityService", () => {
  let activityService: ActivityService = null;

  let _ACTIVITIES_FIXTURES_: Activity[] = null;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    _ACTIVITIES_FIXTURES_ = _.cloneDeep(ACTIVITIES_FIXTURES as any[]);

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
        Promise.resolve(_ACTIVITIES_FIXTURES_)
      );

      // When
      const promise: Promise<Activity[]> = activityService.fetch();

      // Then
      promise.then(
        (result: Activity[]) => {
          expect(result).not.toBeNull();
          expect(result.length).toEqual(_ACTIVITIES_FIXTURES_.length);
          expect(result).toEqual(_ACTIVITIES_FIXTURES_);
          expect(findDaoSpy).toHaveBeenCalledTimes(1);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should clear activities", done => {
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
        }
      );
    });

    it("should remove activities by activity ids", done => {
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
          expect(removeByManyIdsSpy).toHaveBeenCalledWith(activitiesToDelete);
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });
  });

  describe("Activity compliance with athlete settings", () => {
    it("should resolve activities compliant with athlete settings", done => {
      // Given
      const athleteSnapshot = new AthleteSnapshot(
        Gender.MEN,
        null,
        new AthleteSettings(
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
        new DatedAthleteSettings(null, athleteSnapshot.athleteSettings)
      ]);

      const activities: Activity[] = [];
      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(Promise.resolve(activities));

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
        }
      );
    });

    it("should resolve activities compliant with athlete settings hasDatedAthleteSettings=true", done => {
      // Given
      const athleteSnapshot01 = new AthleteSnapshot(
        Gender.MEN,
        null,
        new AthleteSettings(
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

      const datedAthleteSettings = [
        new DatedAthleteSettings("2018-01-14", athleteSnapshot02.athleteSettings),
        new DatedAthleteSettings(null, athleteSnapshot01.athleteSettings)
      ];

      const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettings);

      const activities: Activity[] = [];
      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(Promise.resolve(activities));

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
        }
      );
    });

    it("should resolve non consistent activities ids which are not compliant athlete settings hasDatedAthleteSettings=true", done => {
      // Given
      const athleteModel01 = new AthleteSnapshot(
        Gender.MEN,
        null,
        new AthleteSettings(
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

      const datedAthleteSettings = [
        new DatedAthleteSettings("2018-01-15", athleteModel02.athleteSettings),
        new DatedAthleteSettings(null, athleteModel01.athleteSettings)
      ];

      const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettings);

      const activities: Activity[] = [];
      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(Promise.resolve(activities));

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
        }
      );
    });

    it("should resolve activities NOT compliant with athlete settings", done => {
      // Given
      const athleteSnapshot = new AthleteSnapshot(
        Gender.MEN,
        null,
        new AthleteSettings(
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

      const activities: Activity[] = [];
      activities.push(
        FakeActivityHelper.create(
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
      activities.push(
        FakeActivityHelper.create(
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

      activities.push(
        FakeActivityHelper.create(
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

      const findDaoSpy = spyOn(activityService.activityDao, "find").and.returnValue(Promise.resolve(activities));

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
        }
      );
    });
  });
});
