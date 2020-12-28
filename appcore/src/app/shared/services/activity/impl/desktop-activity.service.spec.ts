import { TestBed } from "@angular/core/testing";

import { ActivityRecalculateNotification, DesktopActivityService } from "./desktop-activity.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import {
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { PROMISE_TRON } from "../../../../desktop/ipc-messages/promise-tron.interface";
import { PromiseTronServiceMock } from "../../../../desktop/ipc-messages/promise-tron.service.mock";
import _ from "lodash";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { TargetModule } from "../../../modules/target/desktop-target.module";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("DesktopActivityService", () => {
  let desktopActivityService: DesktopActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        DesktopActivityService,
        { provide: PROMISE_TRON, useClass: PromiseTronServiceMock },
        { provide: DataStore, useClass: TestingDataStore }
      ]
    });

    desktopActivityService = TestBed.inject(DesktopActivityService);
  });

  describe("Compute", () => {
    it("should compute a synced activity along user settings, athlete snapshot and streams", done => {
      // Given
      const syncedActivityModel: SyncedActivityModel = new SyncedActivityModel();
      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
      const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(
        Gender.MEN,
        AthleteSettingsModel.DEFAULT_MODEL
      );
      const streams: ActivityStreamsModel = new ActivityStreamsModel([0, 1], [0, 1], [0, 1]);
      const smoothAltitude = false;
      const expectedFlaggedIpcMessage: FlaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams,
        smoothAltitude
      );
      const sendMessageSpy = spyOn(desktopActivityService.ipcMessagesSender, "send").and.returnValue(
        Promise.resolve(syncedActivityModel)
      );

      // When
      const promise: Promise<SyncedActivityModel> = desktopActivityService.compute(
        syncedActivityModel,
        userSettingsModel,
        athleteSnapshotModel,
        streams
      );

      // Then
      promise.then(
        () => {
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedFlaggedIpcMessage);
          done();
        },
        err => {
          throw new Error(err);
        }
      );
    });

    it("should reject compute of a synced activity along user settings, athlete snapshot and streams", done => {
      // Given
      const syncedActivityModel: SyncedActivityModel = new SyncedActivityModel();
      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
      const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(
        Gender.MEN,
        AthleteSettingsModel.DEFAULT_MODEL
      );
      const streams: ActivityStreamsModel = new ActivityStreamsModel([0, 1], [0, 1], [0, 1]);
      const smoothAltitude = false;
      const expectedFlaggedIpcMessage: FlaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams,
        smoothAltitude
      );
      const expectedErrorMessage = "Computation error";
      const sendMessageSpy = spyOn(desktopActivityService.ipcMessagesSender, "send").and.returnValue(
        Promise.reject(expectedErrorMessage)
      );

      // When
      const promise: Promise<SyncedActivityModel> = desktopActivityService.compute(
        syncedActivityModel,
        userSettingsModel,
        athleteSnapshotModel,
        streams
      );

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err).toEqual(expectedErrorMessage);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedFlaggedIpcMessage);
          done();
        }
      );
    });
  });

  describe("Recalculate stats", () => {
    it("should recalculate of a synced activity along user settings given", done => {
      // Given
      const activityId = "1111";
      const syncedActivityModel: SyncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.id = activityId;
      syncedActivityModel.start_time = new Date().toISOString();

      const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(
        Gender.MEN,
        AthleteSettingsModel.DEFAULT_MODEL
      );
      const expectedSyncedActivityModel = _.cloneDeep(syncedActivityModel);
      expectedSyncedActivityModel.extendedStats = new AnalysisDataModel();
      expectedSyncedActivityModel.athleteSnapshot = athleteSnapshotModel;

      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
      const streams: ActivityStreamsModel = new ActivityStreamsModel([0, 1], [0, 1], [0, 1]);
      const smoothAltitude = false;
      const expectedFlaggedIpcMessage: FlaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams,
        smoothAltitude
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
      const sendMessageSpy = spyOn(desktopActivityService.ipcMessagesSender, "send").and.returnValue(
        Promise.resolve(expectedSyncedActivityModel)
      );
      const updateDbSpy = spyOn(desktopActivityService.activityDao, "put").and.returnValue(
        Promise.resolve(expectedSyncedActivityModel)
      );

      // When
      const promise: Promise<SyncedActivityModel> = desktopActivityService.recalculateSingle(
        syncedActivityModel,
        userSettingsModel
      );

      // Then
      promise.then(
        result => {
          expect(athleteSnapshotUpdateSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledWith(new Date(expectedSyncedActivityModel.start_time));
          expect(streamGetByIdSpy).toHaveBeenCalledTimes(1);
          expect(streamGetByIdSpy).toHaveBeenCalledWith(expectedSyncedActivityModel.id);
          expect(selfComputeSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedFlaggedIpcMessage);
          expect(updateDbSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedSyncedActivityModel);

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
      const syncedActivityModel: SyncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.id = activityId;
      syncedActivityModel.start_time = new Date().toISOString();

      const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(
        Gender.MEN,
        AthleteSettingsModel.DEFAULT_MODEL
      );
      const expectedSyncedActivityModel = _.cloneDeep(syncedActivityModel);
      expectedSyncedActivityModel.extendedStats = new AnalysisDataModel();
      expectedSyncedActivityModel.athleteSnapshot = athleteSnapshotModel;

      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
      const streams: ActivityStreamsModel = null;
      // const compressedStreamModel = null;
      const smoothAltitude = false;
      const expectedFlaggedIpcMessage: FlaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams,
        smoothAltitude
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
      const sendMessageSpy = spyOn(desktopActivityService.ipcMessagesSender, "send").and.returnValue(
        Promise.resolve(expectedSyncedActivityModel)
      );
      const updateDbSpy = spyOn(desktopActivityService.activityDao, "put").and.returnValue(
        Promise.resolve(expectedSyncedActivityModel)
      );

      // When
      const promise: Promise<SyncedActivityModel> = desktopActivityService.recalculateSingle(
        syncedActivityModel,
        userSettingsModel
      );

      // Then
      promise.then(
        result => {
          expect(athleteSnapshotUpdateSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledTimes(1);
          expect(athleteSnapshotResolveSpy).toHaveBeenCalledWith(new Date(expectedSyncedActivityModel.start_time));
          expect(streamGetByIdSpy).toHaveBeenCalledTimes(1);
          expect(streamGetByIdSpy).toHaveBeenCalledWith(expectedSyncedActivityModel.id);
          expect(selfComputeSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledTimes(1);
          expect(sendMessageSpy).toHaveBeenCalledWith(expectedFlaggedIpcMessage);
          expect(updateDbSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedSyncedActivityModel);

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
      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;

      const syncedActivityModel01 = new SyncedActivityModel();
      syncedActivityModel01.id = "1111";

      const syncedActivityModel02 = new SyncedActivityModel();
      syncedActivityModel02.id = "2222";

      const syncedActivityModel03 = new SyncedActivityModel();
      syncedActivityModel03.id = "3333";

      const syncedActivityModels = [syncedActivityModel01, syncedActivityModel02, syncedActivityModel03];

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake(
        (syncedActivityModel: SyncedActivityModel) => {
          return Promise.resolve(syncedActivityModel); // Bypass recalculation of an activity. Already tested.
        }
      );

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculate(syncedActivityModels, userSettingsModel);

      // Then
      desktopActivityService.recalculate$.subscribe(
        (notification: ActivityRecalculateNotification) => {
          expect(desktopActivityService.isRecalculating).toBeTruthy();
          expect(notification).toBeDefined();
          expect(notification.toProcessCount).toEqual(syncedActivityModels.length);
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
      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;

      const activityIds = ["1111", "2222", "3333"];

      const getByIdSpy = spyOn(desktopActivityService, "getById").and.callFake(id => {
        const syncedActivityModel = new SyncedActivityModel();
        syncedActivityModel.id = id;
        return Promise.resolve(syncedActivityModel);
      });

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake(
        (syncedActivityModel: SyncedActivityModel) => {
          return Promise.resolve(syncedActivityModel); // Bypass recalculation of an activity. Already tested.
        }
      );

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculateFromIds(activityIds, userSettingsModel);

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
      const userSettingsModel: DesktopUserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;

      const syncedActivityModel01 = new SyncedActivityModel();
      syncedActivityModel01.id = "1111";

      const syncedActivityModel02 = new SyncedActivityModel();
      syncedActivityModel02.id = "2222";

      const syncedActivityModel03 = new SyncedActivityModel();
      syncedActivityModel03.id = "3333";

      const syncedActivityModels = [syncedActivityModel01, syncedActivityModel02, syncedActivityModel03];

      const recalculateSpy = spyOn(desktopActivityService, "recalculateSingle").and.callFake(
        (syncedActivityModel: SyncedActivityModel) => {
          return Promise.resolve(syncedActivityModel); // Bypass recalculation of an activity. Already tested.
        }
      );

      const fetchSpy = spyOn(desktopActivityService, "fetch").and.returnValue(Promise.resolve(syncedActivityModels));

      const verifyActivitiesWithSettingsLackingSpy = spyOn(
        desktopActivityService,
        "verifyActivitiesWithSettingsLacking"
      ).and.stub();

      // When
      desktopActivityService.recalculateAll(userSettingsModel);

      // Then
      desktopActivityService.recalculate$.subscribe(
        (notification: ActivityRecalculateNotification) => {
          expect(desktopActivityService.isRecalculating).toBeTruthy();
          expect(notification).toBeDefined();
          expect(notification.toProcessCount).toEqual(syncedActivityModels.length);
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
