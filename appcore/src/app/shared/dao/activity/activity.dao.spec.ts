import { TestBed } from "@angular/core/testing";
import { ActivityDao } from "./activity.dao";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import moment from "moment";
import { Activity } from "@elevate/shared/models/sync/activity.model";

describe("ActivityDao", () => {
  let activityDao: ActivityDao;

  let activitiesCollection: Collection<Activity>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    // Retrieve injected service
    activityDao = TestBed.inject(ActivityDao);

    activitiesCollection = activityDao.dataStore.db.addCollection(ActivityDao.COLLECTION_DEF.name);

    done();
  });

  describe("Find by dated session", () => {
    let activity01;
    let activity02;
    let activity03;

    beforeEach(done => {
      activity01 = {
        name: "My 1st ride",
        startTime: "2020-06-01T12:00:00.000Z",
        endTime: "2020-06-01T13:00:00.000Z"
      } as Activity;
      activity02 = {
        name: "My 2nd ride",
        startTime: "2020-06-01T14:00:00.000Z",
        endTime: "2020-06-01T15:00:00.000Z"
      } as Activity;
      activity03 = {
        name: "My 3rd ride",
        startTime: "2020-06-01T16:00:00.000Z",
        endTime: "2020-06-01T17:00:00.000Z"
      } as Activity;
      activitiesCollection.insert(activity01);
      activitiesCollection.insert(activity02);
      activitiesCollection.insert(activity03);

      done();
    });

    it("should not find existing activities for a given session", done => {
      // Given
      // 13h15 => 13h45
      const activityStartTime = "2020-06-01T13:15:00.000Z";
      const activityDurationSeconds = 30 * 60; // 30 minutes
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(0);
        done();
      });
    });

    it("should find 1 existing activities for a given session (1)", done => {
      // Given
      // 11h30 => 12h30
      const activityStartTime = "2020-06-01T11:30:00.000Z";
      const activityDurationSeconds = 60 * 60; // 60 minutes
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(activity01.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (2)", done => {
      // Given
      // 14h10 => 14h40
      const activityStartTime = "2020-06-01T14:10:00.000Z";
      const activityDurationSeconds = 30 * 60; // 30 minutes
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(activity02.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (3)", done => {
      // Given
      // 16h30 => 17h30
      const activityStartTime = "2020-06-01T16:30:00.000Z";
      const activityDurationSeconds = 60 * 60; // 60 minutes
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(activity03.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (4)", done => {
      // Given
      // 12h30 => 13h30
      const activityStartTime = "2020-06-01T12:30:00.000Z";
      const activityDurationSeconds = 60 * 60; // 1h
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(activity01.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (5)", done => {
      // Given
      // 14 => 15
      const activityStartTime = "2020-06-01T14:00:00.000Z";
      const activityEndTime = "2020-06-01T15:00:00.000Z";

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(activity02.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (1)", done => {
      // Given
      // 12h30 => 14h30
      const activityStartTime = "2020-06-01T12:30:00.000Z";
      const activityDurationSeconds = 120 * 60; // 2h
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(activity01.name);
        expect(results[1].name).toEqual(activity02.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (2)", done => {
      // Given
      // 14h30 => 16h30
      const activityStartTime = "2020-06-01T14:30:00.000Z";
      const activityDurationSeconds = 120 * 60; // 2h
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(activity02.name);
        expect(results[1].name).toEqual(activity03.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (3)", done => {
      // Given
      // 14h30 => 17h30
      const activityStartTime = "2020-06-01T14:30:00.000Z";
      const activityDurationSeconds = 180 * 60; // 3h
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(activity02.name);
        expect(results[1].name).toEqual(activity03.name);
        done();
      });
    });

    it("should find 3 existing activities for a given session (1)", done => {
      // Given
      // 11h00 => 18h00
      const activityStartTime = "2020-06-01T11:00:00.000Z";
      const activityDurationSeconds = 60 * 60 * 7; // 7h
      const activityEndTime = moment(activityStartTime).add(activityDurationSeconds, "seconds").toISOString();

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityEndTime);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(3);
        expect(results[0].name).toEqual(activity01.name);
        expect(results[1].name).toEqual(activity02.name);
        expect(results[2].name).toEqual(activity03.name);
        done();
      });
    });
  });

  describe("Find lacking of athlete settings (= missing stress scores)", () => {
    it("should detect any activities lacking of athlete settings", done => {
      // Given
      const activities: Partial<Activity>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: true },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: true },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" }
      ];

      activitiesCollection.insert(activities as Activity[]);

      // When
      const promise = activityDao.hasActivitiesWithSettingsLacks();

      // Then
      promise.then(
        result => {
          expect(result).toBeTruthy();
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should NOT detect any activities lacking of athlete settings", done => {
      // Given
      const activities: Partial<Activity>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: false },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: false },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" }
      ];

      activitiesCollection.insert(activities as Activity[]);

      // When
      const promise = activityDao.hasActivitiesWithSettingsLacks();

      // Then
      promise.then(
        result => {
          expect(result).toBeFalsy();
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should find activities lacking of athlete settings", done => {
      // Given
      const expectedSize = 2;
      const activities: Partial<Activity>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: true },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: true },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" }
      ];

      activitiesCollection.insert(activities as Activity[]);

      // When
      const promise = activityDao.findActivitiesWithSettingsLacks();

      // Then
      promise.then(
        activitiesResult => {
          expect(activitiesResult.length).toEqual(expectedSize);
          expect(activitiesResult[0]).toEqual(activities[1] as Activity);
          expect(activitiesResult[1]).toEqual(activities[3] as Activity);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should NOT find activities lacking of athlete settings", done => {
      // Given
      const expectedSize = 0;
      const activities: Partial<Activity>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: false },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: false },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" }
      ];

      activitiesCollection.insert(activities as Activity[]);

      // When
      const promise = activityDao.findActivitiesWithSettingsLacks();

      // Then
      promise.then(
        activitiesResult => {
          expect(activitiesResult.length).toEqual(expectedSize);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });
  });
});
