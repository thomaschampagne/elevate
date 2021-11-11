import { TestBed } from "@angular/core/testing";
import { ActivityRecalculateNotification, DesktopActivityService } from "./desktop-activity.service";
import { SharedModule } from "../../../shared.module";
import { IpcRendererTunnelServiceMock } from "../../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { DataStore } from "../../../data-store/data-store";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { TargetModule } from "../../../modules/target/desktop-target.module";
import { CoreModule } from "../../../../core/core.module";
import _ from "lodash";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Channel } from "@elevate/shared/electron/channels.enum";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("DesktopActivityService", () => {
  let desktopActivityService: DesktopActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        DesktopActivityService,
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock },
        { provide: DataStore, useClass: TestingDataStore }
      ]
    });

    desktopActivityService = TestBed.inject(DesktopActivityService);
  });

  describe("Compute", () => {
    it("should compute a synced activity along user settings, athlete snapshot and streams", done => {
      // Given
      const activity: Activity = new Activity();
      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;
      const athleteSnapshotModel: AthleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL);
      const streams: Streams = new Streams();
      streams.time = [0, 1];
      streams.distance = [0, 1];
      streams.velocity_smooth = [0, 1];

      const expectedIpcMessage = new IpcMessage(
        Channel.computeActivity,
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );
      const sendMessageSpy = spyOn(desktopActivityService.ipcTunnelService, "send").and.returnValue(
        Promise.resolve(activity)
      );

      // When
      const promise: Promise<Activity> = desktopActivityService.compute(
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );

      // Then
      promise.then(
        () => {
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedIpcMessage);
          done();
        },
        err => {
          throw new Error(err);
        }
      );
    });

    it("should reject compute of a synced activity along user settings, athlete snapshot and streams", done => {
      // Given
      const activity: Activity = new Activity();
      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;
      const athleteSnapshotModel: AthleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL);
      const streams: Streams = new Streams();
      streams.time = [0, 1];
      streams.distance = [0, 1];
      streams.velocity_smooth = [0, 1];

      const expectedIpcMessage = new IpcMessage(
        Channel.computeActivity,
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );

      const expectedErrorMessage = "Computation error";
      const sendMessageSpy = spyOn(desktopActivityService.ipcTunnelService, "send").and.returnValue(
        Promise.reject(expectedErrorMessage)
      );

      // When
      const promise: Promise<Activity> = desktopActivityService.compute(
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err).toEqual(expectedErrorMessage);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedIpcMessage);
          done();
        }
      );
    });
  });

  describe("Recalculate stats", () => {
    it("should recalculate of a synced activity along user settings given", done => {
      // Given
      const activityId = "1111";
      const activity: Activity = new Activity();
      activity.id = activityId;
      activity.startTime = new Date().toISOString();

      const athleteSnapshotModel: AthleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL);
      const expectedActivity = _.cloneDeep(activity);
      expectedActivity.stats = new ActivityStats();
      expectedActivity.athleteSnapshot = athleteSnapshotModel;

      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;
      const streams: Streams = new Streams();
      streams.time = [0, 1];
      streams.distance = [0, 1];
      streams.velocity_smooth = [0, 1];

      const expectedIpcMessage = new IpcMessage(
        Channel.computeActivity,
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );

      const athleteSnapshotUpdateSpy = spyOn(desktopActivityService.athleteSnapshotResolver, "update").and.returnValue(
        Promise.resolve()
      );
      const athleteSnapshotResolveSpy = spyOn(
        desktopActivityService.athleteSnapshotResolver,
        "resolve"
      ).and.returnValue(athleteSnapshotModel);
      const streamGetByIdSpy = spyOn(desktopActivityService.streamsService, "getInflatedById").and.returnValue(
        Promise.resolve(streams)
      );
      const selfComputeSpy = spyOn(desktopActivityService, "compute").and.callThrough();
      const sendMessageSpy = spyOn(desktopActivityService.ipcTunnelService, "send").and.returnValue(
        Promise.resolve(expectedActivity)
      );
      const updateDbSpy = spyOn(desktopActivityService.activityDao, "put").and.returnValue(
        Promise.resolve(expectedActivity)
      );

      // When
      const promise: Promise<Activity> = desktopActivityService.recalculateSingle(activity, userSettings);

      // Then
      promise.then(
        result => {
          expect(athleteSnapshotUpdateSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledWith(new Date(expectedActivity.startTime));
          expect(streamGetByIdSpy).toHaveBeenCalledTimes(1);
          expect(streamGetByIdSpy).toHaveBeenCalledWith(expectedActivity.id);
          expect(selfComputeSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedIpcMessage);
          expect(updateDbSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedActivity);

          done();
        },
        err => {
          throw new Error(err);
        }
      );
    });

    it("should recalculate a synced activity which has NO stream (AthleteSnapshotModel has to be updated)", done => {
      // Given
      const activityId = "1111";
      const activity: Activity = new Activity();
      activity.id = activityId;
      activity.startTime = new Date().toISOString();

      const athleteSnapshotModel: AthleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL);
      const expectedActivity = _.cloneDeep(activity);
      expectedActivity.stats = new ActivityStats();
      expectedActivity.athleteSnapshot = athleteSnapshotModel;

      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;
      const streams: Streams = null;
      const expectedIpcMessage = new IpcMessage(
        Channel.computeActivity,
        activity,
        athleteSnapshotModel,
        streams,
        userSettings
      );

      const athleteSnapshotUpdateSpy = spyOn(desktopActivityService.athleteSnapshotResolver, "update").and.returnValue(
        Promise.resolve()
      );
      const athleteSnapshotResolveSpy = spyOn(
        desktopActivityService.athleteSnapshotResolver,
        "resolve"
      ).and.returnValue(athleteSnapshotModel);
      const streamGetByIdSpy = spyOn(desktopActivityService.streamsService, "getInflatedById").and.returnValue(
        Promise.resolve(streams)
      );
      const selfComputeSpy = spyOn(desktopActivityService, "compute").and.callThrough();
      const sendMessageSpy = spyOn(desktopActivityService.ipcTunnelService, "send").and.returnValue(
        Promise.resolve(expectedActivity)
      );
      const updateDbSpy = spyOn(desktopActivityService.activityDao, "put").and.returnValue(
        Promise.resolve(expectedActivity)
      );

      // When
      const promise: Promise<Activity> = desktopActivityService.recalculateSingle(activity, userSettings);

      // Then
      promise.then(
        result => {
          expect(athleteSnapshotUpdateSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledWith(new Date(expectedActivity.startTime));
          expect(streamGetByIdSpy).toHaveBeenCalledTimes(1);
          expect(streamGetByIdSpy).toHaveBeenCalledWith(expectedActivity.id);
          expect(selfComputeSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedIpcMessage);
          expect(updateDbSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedActivity);

          done();
        },
        err => {
          throw new Error(err);
        }
      );
    });
  });

  describe("Bulk recalculate", () => {
    it("should bulk compute a set of synced activities", done => {
      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;

      const activity01 = new Activity();
      activity01.id = "1111";

      const activity02 = new Activity();
      activity02.id = "2222";

      const activity03 = new Activity();
      activity03.id = "3333";

      const activities = [activity01, activity02, activity03];

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake((activity: Activity) => {
        return Promise.resolve(activity); // Bypass recalculation of an activity. Already tested.
      });

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculate(activities, userSettings);

      // Then
      desktopActivityService.recalculate$.subscribe(
        (notification: ActivityRecalculateNotification) => {
          expect(desktopActivityService.isRecalculating).toBeTruthy();
          expect(notification).toBeDefined();
          expect(notification.toProcessCount).toEqual(activities.length);
          if (notification.ended) {
            expect(recalculateSpy).toHaveBeenCalledTimes(3);
            setTimeout(() => {
              expect(verifyActivitiesWithSettingsLackingSpy).toHaveBeenCalledTimes(1);
              expect(desktopActivityService.isRecalculating).toBeFalsy();
              done();
            });
          }
        },
        error => {
          throw error;
        },
        () => {
          throw new Error("Should not complete");
        }
      );
    });

    it("should bulk compute a set of synced activities ids", done => {
      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;

      const activityIds = ["1111", "2222", "3333"];

      const getByIdSpy = spyOn(desktopActivityService, "getById").and.callFake(id => {
        const activity = new Activity();
        activity.id = id;
        return Promise.resolve(activity);
      });

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake((activity: Activity) => {
        return Promise.resolve(activity); // Bypass recalculation of an activity. Already tested.
      });

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculateFromIds(activityIds, userSettings);

      // Then
      desktopActivityService.recalculate$.subscribe(
        (notification: ActivityRecalculateNotification) => {
          expect(desktopActivityService.isRecalculating).toBeTruthy();
          expect(notification).toBeDefined();
          expect(notification.toProcessCount).toEqual(activityIds.length);
          if (notification.ended) {
            expect(getByIdSpy).toHaveBeenCalledTimes(3);
            expect(recalculateSpy).toHaveBeenCalledTimes(3);
            setTimeout(() => {
              expect(verifyActivitiesWithSettingsLackingSpy).toHaveBeenCalledTimes(1);
              expect(desktopActivityService.isRecalculating).toBeFalsy();
              done();
            });
          }
        },
        error => {
          throw error;
        },
        () => {
          throw new Error("Should not complete");
        }
      );
    });

    it("should refresh all activities", done => {
      // Given
      const userSettings: DesktopUserSettings = DesktopUserSettings.DEFAULT_MODEL;

      const activity01 = new Activity();
      activity01.id = "1111";

      const activity02 = new Activity();
      activity02.id = "2222";

      const activity03 = new Activity();
      activity03.id = "3333";

      const activities = [activity01, activity02, activity03];

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake((activity: Activity) => {
        return Promise.resolve(activity); // Bypass recalculation of an activity. Already tested.
      });

      const fetchSpy = spyOn(desktopActivityService, "fetch").and.returnValue(Promise.resolve(activities));

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculateAll(userSettings);

      // Then
      desktopActivityService.recalculate$.subscribe(
        (notification: ActivityRecalculateNotification) => {
          expect(desktopActivityService.isRecalculating).toBeTruthy();
          expect(notification).toBeDefined();
          expect(notification.toProcessCount).toEqual(activities.length);
          if (notification.ended) {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(recalculateSpy).toHaveBeenCalledTimes(3);
            setTimeout(() => {
              expect(verifyActivitiesWithSettingsLackingSpy).toHaveBeenCalledTimes(1);
              expect(desktopActivityService.isRecalculating).toBeFalsy();
              done();
            });
          }
        },
        error => {
          throw error;
        },
        () => {
          throw new Error("Should not complete");
        }
      );
    });
  });
});
