import { TestBed } from "@angular/core/testing";
import { ActivityDao } from "./activity.dao";
import * as _ from "lodash";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { SyncedActivityModel } from "@elevate/shared/models";
import { DesktopModule } from "../../modules/desktop/desktop.module";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";

describe("ActivityDao", () => {
  let activityDao: ActivityDao;

  let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

  let activitiesCollection: Collection<SyncedActivityModel>;

  beforeEach(done => {
    _TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, DesktopModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }],
    });

    // Retrieve injected service
    activityDao = TestBed.inject(ActivityDao);

    activitiesCollection = activityDao.dataStore.db.addCollection(ActivityDao.COLLECTION_DEF.name);

    done();
  });

  describe("Find by dated session", () => {
    let syncedActivityModel01;
    let syncedActivityModel02;
    let syncedActivityModel03;

    beforeEach(done => {
      syncedActivityModel01 = {
        name: "My 1st ride",
        start_time: "2020-06-01T12:00:00.000Z",
        end_time: "2020-06-01T13:00:00.000Z",
      } as SyncedActivityModel;
      syncedActivityModel02 = {
        name: "My 2nd ride",
        start_time: "2020-06-01T14:00:00.000Z",
        end_time: "2020-06-01T15:00:00.000Z",
      } as SyncedActivityModel;
      syncedActivityModel03 = {
        name: "My 3rd ride",
        start_time: "2020-06-01T16:00:00.000Z",
        end_time: "2020-06-01T17:00:00.000Z",
      } as SyncedActivityModel;
      activitiesCollection.insert(syncedActivityModel01);
      activitiesCollection.insert(syncedActivityModel02);
      activitiesCollection.insert(syncedActivityModel03);

      done();
    });

    it("should not find existing activities for a given session", done => {
      // Given
      // 13h15 => 13h45
      const activityStartTime = "2020-06-01T13:15:00.000Z";
      const activityDurationSeconds = 30 * 60; // 30 minutes

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

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

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(syncedActivityModel01.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (2)", done => {
      // Given
      // 14h10 => 14h40
      const activityStartTime = "2020-06-01T14:10:00.000Z";
      const activityDurationSeconds = 30 * 60; // 30 minutes

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(syncedActivityModel02.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (3)", done => {
      // Given
      // 16h30 => 17h30
      const activityStartTime = "2020-06-01T16:30:00.000Z";
      const activityDurationSeconds = 60 * 60; // 60 minutes

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(syncedActivityModel03.name);
        done();
      });
    });

    it("should find 1 existing activities for a given session (4)", done => {
      // Given
      // 12h30 => 13h30
      const activityStartTime = "2020-06-01T12:30:00.000Z";
      const activityDurationSeconds = 60 * 60; // 1h

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(1);
        expect(results[0].name).toEqual(syncedActivityModel01.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (1)", done => {
      // Given
      // 12h30 => 14h30
      const activityStartTime = "2020-06-01T12:30:00.000Z";
      const activityDurationSeconds = 120 * 60; // 2h

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(syncedActivityModel01.name);
        expect(results[1].name).toEqual(syncedActivityModel02.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (2)", done => {
      // Given
      // 14h30 => 16h30
      const activityStartTime = "2020-06-01T14:30:00.000Z";
      const activityDurationSeconds = 120 * 60; // 2h

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(syncedActivityModel02.name);
        expect(results[1].name).toEqual(syncedActivityModel03.name);
        done();
      });
    });

    it("should find 2 existing activities for a given session (3)", done => {
      // Given
      // 14h30 => 17h30
      const activityStartTime = "2020-06-01T14:30:00.000Z";
      const activityDurationSeconds = 180 * 60; // 3h

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual(syncedActivityModel02.name);
        expect(results[1].name).toEqual(syncedActivityModel03.name);
        done();
      });
    });

    it("should find 3 existing activities for a given session (1)", done => {
      // Given
      // 11h00 => 18h00
      const activityStartTime = "2020-06-01T11:00:00.000Z";
      const activityDurationSeconds = 60 * 60 * 7; // 7h

      // When
      const promise = activityDao.findByDatedSession(activityStartTime, activityDurationSeconds);

      // Then
      promise.then(results => {
        expect(results.length).toEqual(3);
        expect(results[0].name).toEqual(syncedActivityModel01.name);
        expect(results[1].name).toEqual(syncedActivityModel02.name);
        expect(results[2].name).toEqual(syncedActivityModel03.name);
        done();
      });
    });
  });

  describe("Find lacking of athlete settings (= missing stress scores)", () => {
    it("should detect any activities lacking of athlete settings", done => {
      // Given
      const syncedActivities: Partial<SyncedActivityModel>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: true },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: true },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" },
      ];

      activitiesCollection.insert(syncedActivities as any);

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
      const syncedActivities: Partial<SyncedActivityModel>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: false },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: false },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" },
      ];

      activitiesCollection.insert(syncedActivities as any);

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
      const syncedActivities: Partial<SyncedActivityModel>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: true },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: true },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" },
      ];

      activitiesCollection.insert(syncedActivities as any);

      // When
      const promise = activityDao.findActivitiesWithSettingsLacks();

      // Then
      promise.then(
        activities => {
          expect(activities.length).toEqual(expectedSize);
          expect(activities[0]).toEqual(syncedActivities[1] as SyncedActivityModel);
          expect(activities[1]).toEqual(syncedActivities[3] as SyncedActivityModel);
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
      const syncedActivities: Partial<SyncedActivityModel>[] = [
        { id: "111", name: "111", settingsLack: false },
        { id: "222", name: "222", settingsLack: false },
        { id: "333", name: "333", settingsLack: false },
        { id: "444", name: "444", settingsLack: false },
        { id: "555", name: "555", settingsLack: false },
        { id: "666", name: "666" },
      ];

      activitiesCollection.insert(syncedActivities as any);

      // When
      const promise = activityDao.findActivitiesWithSettingsLacks();

      // Then
      promise.then(
        activities => {
          expect(activities.length).toEqual(expectedSize);
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
