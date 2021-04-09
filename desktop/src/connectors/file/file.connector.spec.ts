// tslint:disable:jsdoc-format
import { ActivityFile, ActivityFileType, FileConnector } from "./file.connector";
import {
  AnalysisDataModel,
  AthleteModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  CadenceDataModel,
  Gender,
  HeartRateDataModel,
  SpeedDataModel,
  Streams,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import fs from "fs";
import path from "path";
import _ from "lodash";
import xmldom from "xmldom";
import {
  ActivitySyncEvent,
  ConnectorType,
  ErrorSyncEvent,
  FileConnectorInfo,
  StartedSyncEvent,
  StoppedSyncEvent,
  SyncEvent,
  SyncEventType
} from "@elevate/shared/sync";
import { filter } from "rxjs/operators";
import { Subject } from "rxjs";
import { BuildTarget, ElevateSport } from "@elevate/shared/enums";
import { BaseConnector, PrimitiveSourceData } from "../base.connector";
import { SportsLib } from "@sports-alliance/sports-lib";
import { ActivityInterface } from "@sports-alliance/sports-lib/lib/activities/activity.interface";
import { DataCadence } from "@sports-alliance/sports-lib/lib/data/data.cadence";
import { Activity } from "@sports-alliance/sports-lib/lib/activities/activity";
import { DataHeartRate } from "@sports-alliance/sports-lib/lib/data/data.heart-rate";
import { Creator } from "@sports-alliance/sports-lib/lib/creators/creator";
import { ActivityTypes } from "@sports-alliance/sports-lib/lib/activities/activity.types";
import { DataPower } from "@sports-alliance/sports-lib/lib/data/data.power";
import { FileConnectorConfig } from "../connector-config.model";
import { container } from "tsyringe";
import { Hash } from "../../tools/hash";

/**
 * Test activities in "fixtures/activities-02" sorted by date ascent.
 * 15 Activities total
 [
 {
		date: '2015-11-30T17:14:38.000Z',
		path: '.../virtual_rides/garmin_export/20151130_virtualride_971150603.fit'
	},
 {
		date: '2016-01-16T14:33:51.000Z',
		path: '.../virtual_rides/garmin_export/20160126_virtualride_1023441137.tcx'
	},
 {
		date: '2016-01-19T17:34:55.000Z',
		path: '.../virtual_rides/garmin_export/20160119_virtualride_1023440829.gpx'
	},
 {
		date: '2016-02-23T17:37:15.000Z',
		path: '.../virtual_rides/strava_export/20160223_virtualride_500553714.tcx'
	},
 {
		date: '2016-04-22T16:44:13.000Z',
		path: '.../virtual_rides/strava_export/20160422_virtualride_553573871.gpx'
	},
 {
		date: '2016-09-11T15:57:36.000Z',
		path: '.../runs/strava_export/20160911_run_708752345.tcx'
	},
 {
		date: '2017-03-19T16:49:30.000Z',
		path: '.../runs/strava_export/20170319_run_906581465.gpx'
	},
 {
		date: '2017-10-08T14:54:11.000Z',
		path: '.../runs/garmin_export/20171008_run_2067489619.gpx'
	},
 {
		date: '2017-10-11T16:48:25.000Z',
		path: '.../runs/garmin_export/20171011_run_2088390344.fit'
	},
 {
		date: '2018-06-22T15:58:38.000Z',
		path: '.../rides/strava_export/20180622_ride_1655245835.tcx'
	},
 {
		date: '2018-10-21T13:50:14.000Z',
		path: '.../runs/garmin_export/20181021_run_3106033902.tcx'
	},
 {
		date: '2019-07-21T14:13:16.000Z',
		path: '.../rides/strava_export/20190721_ride_2551623996.gpx'
	},
 {
		date: '2019-08-11T12:52:20.000Z',
		path: '.../rides/garmin_export/20190811_ride_3939576645.fit'
	},
 {
		date: '2019-08-15T11:10:49.000Z',
		path: '.../rides/garmin_export/20190815_ride_3953195468.tcx'
	},
 {
		date: '2019-09-29T13:58:25.000Z',
		path: '.../rides/garmin_export/20190929_ride_4108490848.gpx'
	}
 ]*/

describe("FileConnector", () => {
  const activitiesLocalPath01 = __dirname + "/fixtures/activities-01/";
  const activitiesLocalPath02 = __dirname + "/fixtures/activities-02/";
  const compressedActivitiesPath = __dirname + "/fixtures/compressed-activities/";

  let fileConnectorConfig: FileConnectorConfig;
  let fileConnector: FileConnector;
  let syncFilesSpy: jasmine.Spy;

  beforeEach(done => {
    fileConnector = container.resolve(FileConnector);

    fileConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettingsModel: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new FileConnectorInfo(activitiesLocalPath01)
    };

    fileConnector = fileConnector.configure(fileConnectorConfig);
    syncFilesSpy = spyOn(fileConnector, "syncFiles").and.callThrough();

    spyOn(fileConnector, "wait").and.returnValue(Promise.resolve());

    done();
  });

  describe("Extract compressed activities files", () => {
    it("should extract a compressed activity (delete archive = false)", done => {
      // Given
      const archiveFileName = "samples.zip";
      const archiveFilePath = compressedActivitiesPath + archiveFileName;
      const archiveFileNameFP = Hash.apply(archiveFileName, Hash.SHA1, { divide: 6 });
      const expectedDecompressedFiles = [
        compressedActivitiesPath + archiveFileNameFP + "-11111.fit",
        compressedActivitiesPath + archiveFileNameFP + "-22222.fit",
        compressedActivitiesPath +
          archiveFileNameFP +
          "-" +
          Hash.apply("/subfolder", Hash.SHA1, { divide: 6 }) +
          "-33333.fit"
      ];
      const unlinkSyncSpy = spyOn(fileConnector.getFs(), "unlinkSync").and.callThrough();
      const deleteArchive = false;

      // When
      const promise: Promise<string[]> = fileConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

      // Then
      promise.then(
        results => {
          expect(results.length).toEqual(3);
          expect(results).toEqual(expectedDecompressedFiles);
          expect(unlinkSyncSpy).not.toHaveBeenCalled();
          expectedDecompressedFiles.forEach(filePath => {
            expect(fs.existsSync(filePath)).toBeTruthy();
            fs.unlinkSync(filePath);
            expect(fs.existsSync(filePath)).toBeFalsy();
          });
          done();
        },
        err => {
          throw new Error(err);
        }
      );
    });

    it("should reject on extraction error", done => {
      // Given
      const archiveFileName = "samples.zip";
      const archiveFilePath = compressedActivitiesPath + archiveFileName;
      const expectedErrorMessage = "Whoops an extraction error";
      spyOn(fileConnector.unArchiver, "unpack").and.returnValue(Promise.reject(expectedErrorMessage));
      const deleteArchive = false;

      const rmdirSyncSpy = spyOn(fileConnector.getFs(), "rmdirSync").and.callThrough();

      // When
      const promise: Promise<string[]> = fileConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err).toEqual(expectedErrorMessage);
          expect(rmdirSyncSpy).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });

    it("should reject on moving extracted files", done => {
      // Given
      const archiveFileName = "samples.zip";
      const archiveFilePath = compressedActivitiesPath + archiveFileName;
      const expectedErrorMessage = "Whoops a move error";
      spyOn(fileConnector.getFs(), "renameSync").and.callFake(() => {
        throw new Error(expectedErrorMessage);
      });
      const rmdirSyncSpy = spyOn(fileConnector.getFs(), "rmdirSync").and.callThrough();
      const deleteArchive = false;

      // When
      const promise: Promise<string[]> = fileConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err.message).toEqual(expectedErrorMessage);
          expect(rmdirSyncSpy).toBeCalled();
          done();
        }
      );
    });

    it("should extract all activities compressed in a directory", done => {
      // Given
      const deleteArchives = true;
      const deflateNotifier = new Subject<string>();
      const recursive = true;
      const notifierNextSpy = spyOn(deflateNotifier, "next").and.callThrough();
      const unlinkSyncSpy = spyOn(fileConnector.getFs(), "unlinkSync").and.stub(); // Avoid remove test archive files with stubbing
      const deflateActivitiesInArchiveSpy = spyOn(fileConnector, "deflateActivitiesFromArchive").and.callThrough();

      // When
      const promise: Promise<void> = fileConnector.scanInflateActivitiesFromArchives(
        compressedActivitiesPath,
        deleteArchives,
        deflateNotifier,
        recursive
      );

      // Then
      deflateNotifier.subscribe(extractedArchive => {
        expect(extractedArchive).toBeDefined();
      });

      promise.then(
        () => {
          expect(deflateActivitiesInArchiveSpy).toHaveBeenCalledTimes(3); // 3 archives
          expect(notifierNextSpy).toHaveBeenCalledTimes(3); // 3 archives
          expect(unlinkSyncSpy).toHaveBeenCalledTimes(3); // 3 archives

          const activityFiles = fileConnector.scanForActivities(compressedActivitiesPath, null, true);
          expect(activityFiles.length).toEqual(9);
          activityFiles.forEach(activityFile => {
            expect(fs.existsSync(activityFile.location.path)).toBeTruthy();
            unlinkSyncSpy.and.callThrough();
            fs.unlinkSync(activityFile.location.path);
            expect(fs.existsSync(activityFile.location.path)).toBeFalsy();
          });

          done();
        },
        err => {
          throw err;
        }
      );
    });
  });

  describe("Scan activities files", () => {
    it("should provide sha1 of activity file", done => {
      // Given
      const sha1 = "290c2e7bf875802199e8c99bab3a3d23a4c6b5cf";
      const data = "john doo";

      // When
      const hashResult = Hash.apply(data);

      // Then
      expect(hashResult).toEqual(sha1);
      done();
    });

    it("should provide a list of compatible activities files (gpx, tcx, fit) from a given directory (no sub-directories scan)", done => {
      // Given
      fileConnector = fileConnector.configure(fileConnectorConfig);
      const expectedLength = 2;

      // When
      const activityFiles: ActivityFile[] = fileConnector.scanForActivities(activitiesLocalPath01);

      // Then
      expect(activityFiles.length).toEqual(expectedLength);

      const rideGpx = _.find(activityFiles, { type: ActivityFileType.GPX });
      expect(rideGpx).toBeDefined();
      expect(fs.existsSync(rideGpx.location.path)).toBeTruthy();
      expect(_.isString(rideGpx.lastModificationDate)).toBeTruthy();

      const virtualRideGpx = _.find(activityFiles, { type: ActivityFileType.FIT });
      expect(virtualRideGpx).toBeDefined();
      expect(fs.existsSync(virtualRideGpx.location.path)).toBeTruthy();

      const runTcx = _.find(activityFiles, { type: ActivityFileType.TCX });
      expect(runTcx).toBeUndefined();

      const activityFake = _.find(activityFiles, { type: "fake" as ActivityFileType });
      expect(activityFake).toBeUndefined();
      done();
    });

    it("should provide a list of compatible activities files (gpx, tcx, fit) from a given directory (with sub-directories scan)", done => {
      // Given
      const recursive = true;
      const expectedLength = 3;

      // When
      const activityFiles: ActivityFile[] = fileConnector.scanForActivities(activitiesLocalPath01, null, recursive);

      // Then
      expect(activityFiles.length).toEqual(expectedLength);

      const rideGpx = _.find(activityFiles, { type: ActivityFileType.GPX });
      expect(rideGpx).toBeDefined();
      expect(fs.existsSync(rideGpx.location.path)).toBeTruthy();

      const virtualRideGpx = _.find(activityFiles, { type: ActivityFileType.FIT });
      expect(virtualRideGpx).toBeDefined();
      expect(fs.existsSync(virtualRideGpx.location.path)).toBeTruthy();

      const runTcx = _.find(activityFiles, { type: ActivityFileType.TCX });
      expect(runTcx).toBeDefined();
      expect(fs.existsSync(runTcx.location.path)).toBeTruthy();

      const activityFake = _.find(activityFiles, { type: "fake" as ActivityFileType });
      expect(activityFake).toBeUndefined();
      done();
    });

    it("should provide a list of compatible activities files (gpx, tcx, fit) after a given date", done => {
      // Given
      const expectedLength = 2;
      const afterDate = new Date("2020-01-10T09:00:00.000Z");
      const filesDate = new Date("2020-01-10T10:00:00.000Z");
      const oldDate = new Date("2020-01-05T09:00:00.000Z");
      const recursive = true;

      const getLastAccessDateSpy = spyOn(fileConnector, "getLastAccessDate").and.callFake(absolutePath => {
        if (path.basename(absolutePath) === "virtual_ride.fit") {
          // This file should not be returned
          return oldDate;
        }
        return filesDate;
      });

      // When
      const activityFiles: ActivityFile[] = fileConnector.scanForActivities(
        activitiesLocalPath01,
        afterDate,
        recursive
      );

      // Then
      expect(activityFiles.length).toEqual(expectedLength);

      const rideGpx = _.find(activityFiles, { type: ActivityFileType.GPX });
      expect(rideGpx).toBeDefined();
      expect(fs.existsSync(rideGpx.location.path)).toBeTruthy();

      const runTcx = _.find(activityFiles, { type: ActivityFileType.TCX });
      expect(runTcx).toBeDefined();
      expect(fs.existsSync(runTcx.location.path)).toBeTruthy();

      const virtualRideGpx = _.find(activityFiles, { type: ActivityFileType.FIT });
      expect(virtualRideGpx).toBeUndefined();

      expect(getLastAccessDateSpy).toHaveBeenCalledTimes(3);
      done();
    });
  });

  describe("Root sync", () => {
    beforeEach(done => {
      spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
      done();
    });

    it("should complete the sync", done => {
      // Given
      const expectedStartedSyncEvent = new StartedSyncEvent(ConnectorType.FILE);
      const expectedCompleteCalls = 1;
      let startedSyncEventToBeCaught = null;

      // When
      const syncEvent$ = fileConnector.sync();
      const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

      // Then
      syncEvent$.subscribe(
        (syncEvent: SyncEvent) => {
          if (syncEvent.type === SyncEventType.STARTED) {
            startedSyncEventToBeCaught = syncEvent;
          }

          expect(fileConnector.isSyncing).toBeTruthy();
        },
        error => {
          expect(error).not.toBeDefined();
          throw new Error(error);
        },
        () => {
          expect(startedSyncEventToBeCaught).toEqual(expectedStartedSyncEvent);
          expect(fileConnector.isSyncing).toBeFalsy();
          expect(syncFilesSpy).toBeCalledTimes(1);
          expect(syncEvents$CompleteSpy).toBeCalledTimes(expectedCompleteCalls);
          done();
        }
      );
    });

    it("should stop sync and notify error when syncFiles() reject an 'Unhandled error'", done => {
      // Given
      const expectedErrorSync = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.FILE, "Unhandled error");
      syncFilesSpy.and.returnValue(Promise.reject(expectedErrorSync));

      // When
      const syncEvent$ = fileConnector.sync();
      const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
      const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

      // Then
      syncEvent$.subscribe(
        () => {
          expect(fileConnector.isSyncing).toBeTruthy();
        },
        error => {
          expect(error).toBeDefined();
          expect(syncFilesSpy).toBeCalledTimes(1);
          expect(syncEvents$CompleteSpy).not.toBeCalled();
          expect(syncEvents$ErrorsSpy).toBeCalledTimes(1);
          expect(fileConnector.isSyncing).toBeFalsy();

          done();
        },
        () => {
          throw new Error("Test failed!");
        }
      );
    });

    it("should reject sync if connector is already syncing", done => {
      // Given
      const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.FILE);
      const syncEvent$01 = fileConnector.sync(); // Start a first sync

      // When
      const syncEvents$NextSpy = spyOn(syncEvent$01, "next").and.callThrough();
      const syncEvent$02 = fileConnector.sync(); // Start a 2nd one.

      // Then
      syncEvent$01.subscribe(
        () => {
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
        },
        () => {
          throw new Error("Test failed!");
        },
        () => {
          expect(syncEvent$01).toEqual(syncEvent$02);
          expect(syncEvent$01.isStopped).toBeTruthy();
          expect(syncEvent$02.isStopped).toBeTruthy();
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
          done();
        }
      );
    });
  });

  describe("Stop sync", () => {
    it("should stop a processing sync", done => {
      // Given
      const stopSyncEventReceived = [];
      const expectedStoppedSyncEvent = new StoppedSyncEvent(ConnectorType.FILE);
      const expectedStoppedSyncEventReceived = 1;

      const syncEvent$ = fileConnector.sync();
      syncEvent$
        .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STOPPED))
        .subscribe((syncEvent: StoppedSyncEvent) => {
          stopSyncEventReceived.push(syncEvent);
        });

      // When
      const promise = fileConnector.stop();

      // Then
      expect(fileConnector.stopRequested).toBeTruthy();
      expect(fileConnector.isSyncing).toBeTruthy();
      promise.then(
        () => {
          expect(stopSyncEventReceived.length).toEqual(expectedStoppedSyncEventReceived);
          expect(stopSyncEventReceived[0]).toEqual(expectedStoppedSyncEvent);
          expect(fileConnector.stopRequested).toBeFalsy();
          expect(fileConnector.isSyncing).toBeFalsy();
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject a stop request when no sync is processed", done => {
      // Given
      fileConnector.isSyncing = false;

      // When
      const promise = fileConnector.stop();

      // Then
      expect(fileConnector.stopRequested).toBeTruthy();
      expect(fileConnector.isSyncing).toBeFalsy();
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        () => {
          expect(fileConnector.isSyncing).toBeFalsy();
          expect(fileConnector.stopRequested).toBeFalsy();
          done();
        }
      );
    });
  });

  describe("Sync files", () => {
    it("should sync fully an input folder never synced before", done => {
      // Given
      const syncFromDateTime = null; // Never synced before !!
      const syncEvents$ = new Subject<SyncEvent>();
      const scanSubDirectories = true;
      const deleteArchivesAfterExtract = false;

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = scanSubDirectories;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = deleteArchivesAfterExtract;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      const scanInflateActivitiesFromArchivesSpy = spyOn(
        fileConnector,
        "scanInflateActivitiesFromArchives"
      ).and.callThrough();
      const scanForActivitiesSpy = spyOn(fileConnector, "scanForActivities").and.callThrough();
      const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
      const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
      const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();
      const findSyncedActivityModelsSpy = spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(
        Promise.resolve(null)
      );
      const extractActivityStreamsSpy = spyOn(fileConnector, "extractStreams").and.callThrough();
      const updatePrimitiveStatsFromComputationSpy = spyOn(
        BaseConnector,
        "updatePrimitiveStatsFromComputation"
      ).and.callThrough();
      const syncEventNextSpy = spyOn(syncEvents$, "next").and.stub();

      const expectedName = "Afternoon Ride";
      const expectedStartTime = "2019-08-15T11:10:49.000Z";
      const expectedStartTimeStamp = new Date(expectedStartTime).getTime() / 1000;
      const expectedEndTime = "2019-08-15T14:06:03.000Z";
      const expectedActivityId =
        Hash.apply(expectedStartTime, Hash.SHA1, { divide: 6 }) +
        "-" +
        Hash.apply(expectedEndTime, Hash.SHA1, { divide: 6 });
      const expectedActivityFilePathMatch = "20190815_ride_3953195468.tcx";

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          expect(scanInflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            deleteArchivesAfterExtract,
            jasmine.any(Subject),
            scanSubDirectories
          );
          expect(scanForActivitiesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            syncFromDateTime,
            scanSubDirectories
          );
          expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
          expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
          expect(importFromFITSpy).toHaveBeenCalledTimes(3);

          expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(findSyncedActivityModelsSpy).toHaveBeenNthCalledWith(1, "2019-08-11T12:52:20.000Z", 7263.962);

          expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(15);
          expect(updatePrimitiveStatsFromComputationSpy).toHaveBeenCalledTimes(15);

          const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
          expect(activitySyncEvent).not.toBeNull();
          expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.deflatedStreams).toBeDefined();
          expect(activitySyncEvent.isNew).toBeTruthy();

          expect(activitySyncEvent.activity.start_time).toEqual(expectedStartTime);
          expect(activitySyncEvent.activity.start_timestamp).toEqual(expectedStartTimeStamp);
          expect(activitySyncEvent.activity.end_time).toEqual(expectedEndTime);
          expect(activitySyncEvent.activity.id).toEqual(expectedActivityId);
          expect(activitySyncEvent.activity.name).toEqual(expectedName);
          expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
          expect(activitySyncEvent.activity.hasPowerMeter).toBeFalsy();
          expect(activitySyncEvent.activity.trainer).toBeFalsy();
          expect(Math.floor(activitySyncEvent.activity.distance_raw)).toEqual(59853);
          expect(activitySyncEvent.activity.moving_time_raw).toEqual(10078);
          expect(activitySyncEvent.activity.elapsed_time_raw).toEqual(10514);
          expect(activitySyncEvent.activity.elevation_gain_raw).toEqual(698);
          expect(activitySyncEvent.activity.sourceConnectorType).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.activity.extras.fs_activity_location.path).toContain(expectedActivityFilePathMatch);
          expect(activitySyncEvent.activity.athleteSnapshot).toEqual(
            fileConnector.athleteSnapshotResolver.getCurrent()
          );
          expect(activitySyncEvent.activity.extendedStats).not.toBeNull();

          expect(activitySyncEvent.deflatedStreams).not.toBeNull();

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should sync fully activities of an input folder already synced (no recent activities => syncDateTime = null)", done => {
      // Given
      const syncFromDateTime = null; // Force sync on all scanned files
      const syncEvents$ = new Subject<SyncEvent>();
      const scanSubDirectories = true;
      const deleteArchivesAfterExtract = false;

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = scanSubDirectories;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = deleteArchivesAfterExtract;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      const scanInflateActivitiesFromArchivesSpy = spyOn(
        fileConnector,
        "scanInflateActivitiesFromArchives"
      ).and.callThrough();
      const scanForActivitiesSpy = spyOn(fileConnector, "scanForActivities").and.callThrough();
      const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
      const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
      const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

      const expectedExistingSyncedActivity = new SyncedActivityModel();
      expectedExistingSyncedActivity.name = "Existing activity";
      expectedExistingSyncedActivity.type = ElevateSport.Ride;
      const expectedActivitySyncEvent = new ActivitySyncEvent(
        ConnectorType.FILE,
        null,
        expectedExistingSyncedActivity,
        false
      );
      const findSyncedActivityModelsSpy = spyOn(fileConnector, "findSyncedActivityModels").and.callFake(
        (activityStartDate: string) => {
          expectedExistingSyncedActivity.start_time = activityStartDate;
          return Promise.resolve([expectedExistingSyncedActivity]);
        }
      );
      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const extractActivityStreamsSpy = spyOn(fileConnector, "extractStreams").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvents$, "next").and.stub();

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          expect(scanInflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            deleteArchivesAfterExtract,
            jasmine.any(Subject),
            scanSubDirectories
          );
          expect(scanForActivitiesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            syncFromDateTime,
            scanSubDirectories
          );
          expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
          expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
          expect(importFromFITSpy).toHaveBeenCalledTimes(3);

          expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
          expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);

          expect(syncEventNextSpy).toHaveBeenCalledTimes(16);
          expect(syncEventNextSpy).toHaveBeenCalledWith(expectedActivitySyncEvent);

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should sync recent activities of an input folder already synced (no recent activities => syncDateTime = Date)", done => {
      // Given
      const syncDate = new Date("2019-01-01T12:00:00.000Z");
      const syncEvents$ = new Subject<SyncEvent>();
      const scanSubDirectories = true;

      fileConnectorConfig.syncFromDateTime = syncDate.getTime(); // Force sync on all scanned files
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = scanSubDirectories;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = false;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      const scanInflateActivitiesFromArchivesSpy = spyOn(
        fileConnector,
        "scanInflateActivitiesFromArchives"
      ).and.callThrough();
      const scanForActivitiesSpy = spyOn(fileConnector, "scanForActivities").and.callThrough();

      // Return lastModificationDate greater than syncDateTime when file name contains "2019"
      spyOn(fileConnector, "getLastAccessDate").and.callFake((absolutePath: string) => {
        return absolutePath.match(/2019/gm)
          ? new Date("2019-06-01T12:00:00.000Z") // Fake 2019 date
          : new Date("2018-06-01T12:00:00.000Z"); // Fake 2018 date
      });

      const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
      const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
      const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

      const expectedExistingSyncedActivity = new SyncedActivityModel();
      expectedExistingSyncedActivity.name = "Existing activity";
      expectedExistingSyncedActivity.type = ElevateSport.Ride;
      const findSyncedActivityModelsSpy = spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(
        Promise.resolve(null)
      );
      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const extractActivityStreamsSpy = spyOn(fileConnector, "extractStreams").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvents$, "next").and.stub();

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          expect(scanInflateActivitiesFromArchivesSpy).not.toBeCalled();
          expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath02, syncDate, scanSubDirectories);
          expect(importFromGPXSpy).toHaveBeenCalledTimes(2);
          expect(importFromTCXSpy).toHaveBeenCalledTimes(1);
          expect(importFromFITSpy).toHaveBeenCalledTimes(1);

          expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(4);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(4);
          expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(4);
          expect(syncEventNextSpy).toHaveBeenCalledTimes(5);

          const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
          expect(activitySyncEvent).not.toBeNull();
          expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.deflatedStreams).toBeDefined();
          expect(activitySyncEvent.isNew).toBeTruthy();
          expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
          expect(activitySyncEvent.activity.start_time).toEqual("2019-08-15T11:10:49.000Z");

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should send sync error when multiple activities are found", done => {
      // Given
      const syncFromDateTime = null; // Force sync on all scanned files
      const syncEvents$ = new Subject<SyncEvent>();

      const scanSubDirectories = true;
      const deleteArchivesAfterExtract = false;

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = scanSubDirectories;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = deleteArchivesAfterExtract;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      const scanInflateActivitiesFromArchivesSpy = spyOn(
        fileConnector,
        "scanInflateActivitiesFromArchives"
      ).and.callThrough();
      const scanForActivitiesSpy = spyOn(fileConnector, "scanForActivities").and.callThrough();
      const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
      const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
      const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

      const expectedActivityNameToCreate = "Afternoon Ride";
      const expectedExistingSyncedActivity = new SyncedActivityModel();
      expectedExistingSyncedActivity.name = "Existing activity";
      expectedExistingSyncedActivity.type = ElevateSport.Ride;
      expectedExistingSyncedActivity.start_time = new Date().toISOString();

      // Emulate 1 existing activity
      const findSyncedActivityModelsSpy = spyOn(fileConnector, "findSyncedActivityModels").and.callFake(() => {
        return Promise.resolve([expectedExistingSyncedActivity, expectedExistingSyncedActivity]);
      });

      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const extractActivityStreamsSpy = spyOn(fileConnector, "extractStreams").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvents$, "next").and.stub();
      const expectedActivitiesFound =
        expectedExistingSyncedActivity.name +
        " (" +
        new Date(expectedExistingSyncedActivity.start_time).toString() +
        ")";

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          expect(scanInflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            deleteArchivesAfterExtract,
            jasmine.any(Subject),
            scanSubDirectories
          );
          expect(scanForActivitiesSpy).toHaveBeenCalledWith(
            activitiesLocalPath02,
            syncFromDateTime,
            scanSubDirectories
          );
          expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
          expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
          expect(importFromFITSpy).toHaveBeenCalledTimes(3);

          expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
          expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);

          expect(syncEventNextSpy).toHaveBeenCalledTimes(16);

          syncEventNextSpy.calls.argsFor(1).forEach((errorSyncEvent: ErrorSyncEvent) => {
            expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code);
            expect(errorSyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
            expect(errorSyncEvent.description).toContain(expectedActivityNameToCreate);
            expect(errorSyncEvent.description).toContain(expectedExistingSyncedActivity.type);
            expect(errorSyncEvent.description).toContain(expectedActivitiesFound);
          });

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should continue sync on compute error", done => {
      // Given
      const syncFromDateTime = null; // Force sync on all scanned files
      const syncEvents$ = new Subject<SyncEvent>();
      const errorMessage = "Unable to create bare activity";

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = true;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = false;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
      spyOn(fileConnector, "scanInflateActivitiesFromArchives").and.callThrough();
      spyOn(fileConnector, "scanForActivities").and.callThrough();
      spyOn(SportsLib, "importFromGPX").and.callThrough();
      spyOn(SportsLib, "importFromTCX").and.callThrough();
      spyOn(SportsLib, "importFromFit").and.callThrough();

      spyOn(fileConnector, "createBareActivity").and.callFake((sportsLibActivity: ActivityInterface) => {
        if (sportsLibActivity.startDate.toISOString() === "2019-08-11T12:52:20.000Z") {
          throw new Error(errorMessage);
        }
      });

      spyOn(syncEvents$, "next").and.stub();

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should continue sync on parsing error", done => {
      // Given
      const syncFromDateTime = null; // Force sync on all scanned files
      const syncEvents$ = new Subject<SyncEvent>();
      const errorMessage = "Unable to parse fit file";

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = true;
      fileConnectorConfig.info.extractArchiveFiles = false;
      fileConnectorConfig.info.deleteArchivesAfterExtract = false;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
      spyOn(fileConnector, "scanInflateActivitiesFromArchives").and.callThrough();
      spyOn(fileConnector, "scanForActivities").and.callThrough();
      spyOn(SportsLib, "importFromGPX").and.callThrough();
      spyOn(SportsLib, "importFromTCX").and.callThrough();
      spyOn(SportsLib, "importFromFit").and.returnValue(Promise.reject(errorMessage));
      spyOn(fileConnector, "createBareActivity").and.callThrough();
      spyOn(syncEvents$, "next").and.stub();

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          done();
        },
        () => {
          throw new Error("Should not be here");
        }
      );
    });

    it("should send sync error if source directory do not exists", done => {
      // Given
      const syncDateTime = null; // Force sync on all scanned files
      const syncEvents$ = new Subject<SyncEvent>();
      const fakeSourceDir = "/fake/dir/path";
      const expectedErrorSyncEvent = ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.create(fakeSourceDir);

      fileConnectorConfig.syncFromDateTime = syncDateTime;
      fileConnectorConfig.info.sourceDirectory = fakeSourceDir;
      fileConnector = fileConnector.configure(fileConnectorConfig);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        errorSyncEvent => {
          expect(errorSyncEvent).toEqual(expectedErrorSyncEvent);
          done();
        }
      );
    });
  });

  describe("Process bare activities", () => {
    it("should create a bare activity from a sports-lib activity", done => {
      // Given
      const startISODate = "2019-08-15T11:10:49.000Z";
      const endISODate = "2019-08-15T14:06:03.000Z";
      const expectedId = Hash.apply(startISODate);
      const expectedName = "Afternoon Ride";
      const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";

      SportsLib.importFromTCX(
        new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")
      ).then(event => {
        const sportsLibActivity = event.getFirstActivity();

        // When
        const bareActivity = fileConnector.createBareActivity(sportsLibActivity);

        // Then
        expect(bareActivity.id).toEqual(expectedId);
        expect(bareActivity.type).toEqual(ElevateSport.Ride);
        expect(bareActivity.name).toEqual(expectedName);
        expect(bareActivity.start_time).toEqual(startISODate);
        expect(bareActivity.end_time).toEqual(endISODate);
        expect(bareActivity.hasPowerMeter).toEqual(false);
        expect(bareActivity.trainer).toEqual(false);
        expect(bareActivity.commute).toEqual(null);
        done();
      });
    });

    describe("Find elevate sport type", () => {
      it("should convert known 'sports-lib' type to ElevateSport", done => {
        // Given
        const sportsLibActivity: ActivityInterface = { type: "Cycling" } as ActivityInterface;
        const expectedElevateSport = ElevateSport.Ride;

        // When
        const elevateSportResult: {
          type: ElevateSport;
          autoDetected: boolean;
        } = fileConnector.convertToElevateSport(sportsLibActivity);

        // Then
        expect(elevateSportResult.type).toEqual(expectedElevateSport);

        done();
      });

      it("should convert unknown 'sports-lib' type to ElevateSport other type", done => {
        // Given
        fileConnectorConfig.info.detectSportTypeWhenUnknown = true;
        fileConnector = fileConnector.configure(fileConnectorConfig);

        const sportsLibActivity: ActivityInterface = {
          type: "FakeSport" as ActivityTypes,
          getStats: () => {}
        } as any;

        spyOn(sportsLibActivity, "getStats").and.returnValue({
          get: () => {
            return {
              getValue: () => {
                return {};
              }
            };
          }
        });
        const attemptDetectCommonSportSpy = spyOn(fileConnector, "attemptDetectCommonSport").and.returnValue(
          ElevateSport.Other
        );

        // When
        fileConnector.convertToElevateSport(sportsLibActivity);

        // Then
        expect(attemptDetectCommonSportSpy).toHaveBeenCalledTimes(1);

        done();
      });

      it("should attempt to find Elevate Sport when type is unknown", done => {
        interface TestData {
          distance: number;
          duration: number;
          ascent: number;
          avgSpeed: number;
          maxSpeed: number;
          expectedSport: ElevateSport;
        }

        const prepareTestData = (data: TestData) => {
          data.distance = data.distance * 1000; // km to meters
          data.duration = data.duration * 60; // min to seconds
          data.avgSpeed = data.avgSpeed / 3.6; // kph to m/s
          data.maxSpeed = data.maxSpeed / 3.6; // kph to m/s
          return data;
        };

        // Given
        const activitiesTestData: Partial<TestData>[] = [
          // Rides
          {
            distance: 162,
            duration: 268,
            ascent: 3562.2,
            avgSpeed: 36.3,
            maxSpeed: 81.7,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 66,
            duration: 213,
            ascent: 1578,
            avgSpeed: 20.9,
            maxSpeed: 70.9,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 30,
            duration: 60,
            ascent: 15,
            avgSpeed: 30,
            maxSpeed: 55,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 17,
            duration: 41,
            ascent: 33,
            avgSpeed: 26,
            maxSpeed: 37.4,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 168,
            duration: 506,
            ascent: 274,
            avgSpeed: 28,
            maxSpeed: 45.3,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 32,
            duration: 70,
            ascent: 721,
            avgSpeed: 27.5,
            maxSpeed: 91.8,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 49,
            duration: 135,
            ascent: 1054.56,
            avgSpeed: 22.2,
            maxSpeed: 77,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 141,
            duration: 394,
            ascent: 4043.44,
            avgSpeed: 21.9,
            maxSpeed: 70.5,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 31,
            duration: 94,
            ascent: 525,
            avgSpeed: 20,
            maxSpeed: 56.5,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 44,
            duration: 122,
            ascent: 554,
            avgSpeed: 22.1,
            maxSpeed: 61.2,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 82,
            duration: 217,
            ascent: 1098,
            avgSpeed: 25.4,
            maxSpeed: 61.9,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 53,
            duration: 90,
            ascent: null,
            avgSpeed: 35.3,
            maxSpeed: 39.9,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 32,
            duration: 90,
            ascent: null,
            avgSpeed: 21.9,
            maxSpeed: 28.4,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 12,
            duration: 23,
            ascent: 20,
            avgSpeed: 30.8,
            maxSpeed: 38.1,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 20,
            duration: 79,
            ascent: 99,
            avgSpeed: 22.4,
            maxSpeed: 38.8,
            expectedSport: ElevateSport.Ride
          },

          // Runs
          {
            distance: 12,
            duration: 57,
            ascent: 226,
            avgSpeed: 12.8,
            maxSpeed: 17,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 3,
            duration: 37,
            ascent: 16.2052,
            avgSpeed: 6.6,
            maxSpeed: 18.3,
            expectedSport: ElevateSport.Other
          }, // It's "Run" but too much doubt, then type: Other
          {
            distance: 6,
            duration: 56,
            ascent: 343,
            avgSpeed: 6.7,
            maxSpeed: 12,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 6.17,
            duration: 34,
            ascent: 316,
            avgSpeed: 10,
            maxSpeed: 16.4,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 8,
            duration: 38,
            ascent: 44.5919,
            avgSpeed: 13.3,
            maxSpeed: 21.9,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 5,
            duration: 28,
            ascent: 10.1495,
            avgSpeed: 10.9,
            maxSpeed: 18.3,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 4,
            duration: 33,
            ascent: 6,
            avgSpeed: 10.4,
            maxSpeed: 15.8,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 2,
            duration: 28,
            ascent: 37,
            avgSpeed: 6.3,
            maxSpeed: 11.5,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 12,
            duration: 77,
            ascent: 42,
            avgSpeed: 9.8,
            maxSpeed: 13.6,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 1,
            duration: 25,
            ascent: 17.145,
            avgSpeed: 4.6,
            maxSpeed: 7.9,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 15,
            duration: 62,
            ascent: 205.137,
            avgSpeed: 14.5,
            maxSpeed: 20.8,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 1,
            duration: 14,
            ascent: null,
            avgSpeed: 6.3,
            maxSpeed: 12.9,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 6,
            duration: 109,
            ascent: 594.8,
            avgSpeed: 4.8,
            maxSpeed: 10.4,
            expectedSport: ElevateSport.Run
          },
          {
            distance: 2,
            duration: 41,
            ascent: 12.4471,
            avgSpeed: 4.7,
            maxSpeed: 12.2,
            expectedSport: ElevateSport.Run
          },

          // Low pace Rides
          {
            distance: 1,
            duration: 6,
            ascent: 2,
            avgSpeed: 21.3,
            maxSpeed: 33.4,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 1,
            duration: 6,
            ascent: null,
            avgSpeed: 19.4,
            maxSpeed: 29.5,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 7,
            duration: 88,
            ascent: 55,
            avgSpeed: 8.4,
            maxSpeed: 19.8,
            expectedSport: ElevateSport.Other
          }, // It's "Ride" but too much doubt, then type: Other
          {
            distance: 11,
            duration: 111,
            ascent: 103.688,
            avgSpeed: 12.2,
            maxSpeed: 34.2,
            expectedSport: ElevateSport.Ride
          },
          {
            distance: 2,
            duration: 7,
            ascent: 14,
            avgSpeed: 19.9,
            maxSpeed: 28.8,
            expectedSport: ElevateSport.Ride
          },

          // Skiing
          {
            distance: 129,
            duration: 477,
            ascent: 14283,
            avgSpeed: 18.3,
            maxSpeed: 108.7,
            expectedSport: ElevateSport.Other
          },
          {
            distance: 100,
            duration: 398,
            ascent: 10511,
            avgSpeed: 17.6,
            maxSpeed: 144.3,
            expectedSport: ElevateSport.Other
          },
          {
            distance: 42,
            duration: 224,
            ascent: 3405,
            avgSpeed: 13.2,
            maxSpeed: 85.3,
            expectedSport: ElevateSport.Other
          },
          {
            distance: 40,
            duration: 297,
            ascent: 4477,
            avgSpeed: 13.2,
            maxSpeed: 81.3,
            expectedSport: ElevateSport.Other
          },

          // Unexpected with strange values
          {
            distance: 10,
            duration: 60,
            ascent: 10,
            avgSpeed: null,
            maxSpeed: null,
            expectedSport: ElevateSport.Other
          },
          {
            distance: null,
            duration: 60,
            ascent: 10,
            avgSpeed: 10,
            maxSpeed: 15,
            expectedSport: ElevateSport.Other
          }
        ].map(testData => prepareTestData(testData));

        // When, Then
        activitiesTestData.forEach(testData => {
          const elevateSport = fileConnector.attemptDetectCommonSport(
            testData.distance,
            testData.duration,
            testData.ascent,
            testData.avgSpeed,
            testData.maxSpeed
          );
          expect(elevateSport).toEqual(testData.expectedSport);
        });

        done();
      });
    });

    describe("Update primitive data from computation or input source", () => {
      let syncedActivityModel: SyncedActivityModel = null;
      let streams: Streams = null;
      const defaultMovingTime = 900;
      const defaultElapsedTime = 1000;
      const startDistance = 5;
      const endDistance = 1000;
      const defaultDistance = endDistance;
      const defaultElevationGain = 0;

      beforeEach(done => {
        syncedActivityModel = new SyncedActivityModel();
        syncedActivityModel.extendedStats = {
          movingTime: defaultMovingTime,
          elapsedTime: defaultElapsedTime,
          elevationData: {
            accumulatedElevationAscent: defaultElevationGain
          }
        } as AnalysisDataModel;
        syncedActivityModel.athleteSnapshot = new AthleteSnapshotModel(
          Gender.MEN,
          30,
          AthleteSettingsModel.DEFAULT_MODEL
        );

        streams = new Streams();
        streams.distance = [startDistance, 10, 100, endDistance];

        done();
      });

      it("should update primitive data using computed stats if available", done => {
        // Given
        const primitiveSourceData: PrimitiveSourceData = {
          distanceRaw: 111,
          elapsedTimeRaw: 333,
          movingTimeRaw: 222,
          elevationGainRaw: 444
        };

        // When
        const result = BaseConnector.updatePrimitiveStatsFromComputation(
          syncedActivityModel,
          streams,
          primitiveSourceData
        );

        // Then
        expect(result.elapsed_time_raw).toEqual(defaultElapsedTime);
        expect(result.moving_time_raw).toEqual(defaultMovingTime);
        expect(result.distance_raw).toEqual(defaultDistance);
        expect(result.elevation_gain_raw).toEqual(defaultElevationGain);

        done();
      });

      it("should update primitive data using data provided by source (computation stats not available) (1)", done => {
        // Given
        const primitiveSourceData: PrimitiveSourceData = {
          distanceRaw: 111,
          elapsedTimeRaw: 333,
          movingTimeRaw: 222,
          elevationGainRaw: 444
        };

        syncedActivityModel.extendedStats = null;
        streams.distance = [];

        // When
        const result = BaseConnector.updatePrimitiveStatsFromComputation(
          syncedActivityModel,
          streams,
          primitiveSourceData
        );

        // Then
        expect(result.elapsed_time_raw).toEqual(primitiveSourceData.elapsedTimeRaw);
        expect(result.moving_time_raw).toEqual(primitiveSourceData.movingTimeRaw);
        expect(result.distance_raw).toEqual(primitiveSourceData.distanceRaw);
        expect(result.elevation_gain_raw).toEqual(primitiveSourceData.elevationGainRaw);
        done();
      });

      it("should update primitive data using data provided by source (computation stats not available) (2)", done => {
        // Given
        const primitiveSourceData: PrimitiveSourceData = {
          distanceRaw: 111,
          elapsedTimeRaw: 333,
          movingTimeRaw: 222,
          elevationGainRaw: 444
        };

        syncedActivityModel.extendedStats = {
          movingTime: null,
          elapsedTime: null,
          pauseTime: null,
          elevationData: {
            accumulatedElevationAscent: null
          }
        } as AnalysisDataModel;
        streams.distance = [];

        // When
        const result = BaseConnector.updatePrimitiveStatsFromComputation(
          syncedActivityModel,
          streams,
          primitiveSourceData
        );

        // Then
        expect(result.elapsed_time_raw).toEqual(primitiveSourceData.elapsedTimeRaw);
        expect(result.moving_time_raw).toEqual(primitiveSourceData.movingTimeRaw);
        expect(result.distance_raw).toEqual(primitiveSourceData.distanceRaw);
        expect(result.elevation_gain_raw).toEqual(primitiveSourceData.elevationGainRaw);
        done();
      });

      it("should update primitive data with null values (computation stats & source not available)", done => {
        // Given
        const primitiveSourceData: PrimitiveSourceData = {
          distanceRaw: undefined,
          elapsedTimeRaw: undefined,
          movingTimeRaw: undefined,
          elevationGainRaw: undefined
        };

        syncedActivityModel.extendedStats = {
          movingTime: null,
          elapsedTime: null,
          pauseTime: null,
          elevationData: {
            accumulatedElevationAscent: null
          }
        } as AnalysisDataModel;

        streams.distance = [];

        // When
        const result = BaseConnector.updatePrimitiveStatsFromComputation(
          syncedActivityModel,
          streams,
          primitiveSourceData
        );

        // Then
        expect(result.elapsed_time_raw).toBeNull();
        expect(result.moving_time_raw).toBeNull();
        expect(result.distance_raw).toBeNull();
        expect(result.elevation_gain_raw).toBeNull();
        done();
      });
    });
  });

  describe("Activity streams", () => {
    describe("Extract streams form sport-libs", () => {
      it("should convert sports-lib streams to Streams", done => {
        // Given
        const sportsLibActivity = new Activity(new Date(), new Date(), ActivityTypes.Running, new Creator("John Doo"));

        spyOn(sportsLibActivity, "generateTimeStream").and.returnValue({
          getData: () => [-1]
        });
        spyOn(sportsLibActivity, "getSquashedStreamData").and.callFake((streamType: string) => {
          if (streamType === DataHeartRate.type || streamType === DataCadence.type || streamType === DataPower.type) {
            throw new Error("No streams found");
          }
          return [-1];
        });

        // When
        const streams: Streams = fileConnector.extractStreams(sportsLibActivity);

        // Then
        expect(streams.time[0]).toBeDefined();
        expect(streams.latlng[0]).toBeDefined();
        expect(streams.distance[0]).toBeDefined();
        expect(streams.velocity_smooth[0]).toBeDefined();
        expect(streams.altitude[0]).toBeDefined();
        expect(streams.grade_smooth[0]).toBeDefined();
        expect(streams.grade_adjusted_speed[0]).toBeDefined();
        expect(streams.heartrate).toEqual([]);
        expect(streams.cadence).toEqual([]);
        expect(streams.watts).toEqual([]);

        done();
      });

      it("should convert sports-lib cycling streams (with cadence, power, heartrate) to Streams", done => {
        // Given
        const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
        const expectedSamplesLength = 3179;

        SportsLib.importFromTCX(
          new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")
        ).then(event => {
          const sportsLibActivity = event.getFirstActivity();

          // When
          const streams: Streams = fileConnector.extractStreams(sportsLibActivity);

          // Then
          expect(streams.time.length).toEqual(expectedSamplesLength);
          expect(streams.latlng.length).toEqual(expectedSamplesLength);
          expect(streams.latlng[0]).toEqual([45.21027219, 5.78329785]);
          expect(streams.distance.length).toEqual(expectedSamplesLength);
          expect(streams.altitude.length).toEqual(expectedSamplesLength);
          expect(streams.velocity_smooth.length).toEqual(expectedSamplesLength);
          expect(streams.grade_smooth.length).toEqual(expectedSamplesLength);
          expect(streams.heartrate.length).toEqual(expectedSamplesLength);
          expect(streams.cadence.length).toEqual(expectedSamplesLength);
          expect(streams.watts).toEqual([]);
          expect(streams.grade_adjusted_speed).toEqual([]);

          done();
        });
      });
    });
  });

  describe("Provide activity hash", () => {
    it("should compute hash of an activity", done => {
      // Given
      const activity: Partial<SyncedActivityModel> = {
        id: "fakeId",
        name: "Fake name",
        type: ElevateSport.Ride,
        start_time: "2020-10-28T20:46:48.547Z",
        end_time: "2020-10-28T22:46:48.547Z",
        distance_raw: 61000,
        moving_time_raw: 7100,
        elapsed_time_raw: 7200,
        hasPowerMeter: false,
        trainer: false,
        commute: false,
        elevation_gain_raw: 780,
        start_timestamp: 11111111111,
        extendedStats: { cadenceData: null, calories: 1456 } as any,
        athleteSnapshot: new AthleteSnapshotModel(Gender.MEN, 30, AthleteSettingsModel.DEFAULT_MODEL),
        sourceConnectorType: ConnectorType.FILE,
        latLngCenter: [111, 222]
      };

      // When
      const hash = BaseConnector.activityHash(activity);

      // Then
      expect(hash).toBeDefined();
      expect(hash.length).toEqual(24);

      done();
    });

    it("should compute hash of RIDE activity", done => {
      // Given
      const expectedHash = "b2c158daf51c304e0729fde8";
      const activity: Partial<SyncedActivityModel> = {
        id: "fake",
        type: ElevateSport.Ride,
        start_time: "now",
        end_time: "1 hour later",
        distance_raw: 30000,
        hasPowerMeter: true,
        trainer: false,
        elevation_gain_raw: 450,
        latLngCenter: [33, 44],
        extendedStats: {
          speedData: {
            maxSpeed: 45
          } as SpeedDataModel,
          heartRateData: {
            maxHeartRate: 201
          } as HeartRateDataModel,
          cadenceData: {
            maxCadence: 111
          } as CadenceDataModel
        } as AnalysisDataModel
      };
      // When
      const hash = BaseConnector.activityHash(activity);

      // Then
      expect(hash).toBeDefined();
      expect(hash.length).toEqual(24);
      expect(hash).toEqual(expectedHash);

      done();
    });

    it("should compute hash of RUN activity", done => {
      // Given
      const expectedHash = "45f1950c179ac5810a411eb9";
      const activity: Partial<SyncedActivityModel> = {
        id: "fake",
        type: ElevateSport.Run,
        start_time: "now",
        end_time: "1 hour later",
        distance_raw: 10000,
        hasPowerMeter: false,
        trainer: false,
        elevation_gain_raw: 122,
        latLngCenter: [66, 33],
        extendedStats: {
          speedData: {
            maxSpeed: 13.5
          }
        } as AnalysisDataModel
      };
      // When
      const hash = BaseConnector.activityHash(activity);

      // Then
      expect(hash).toBeDefined();
      expect(hash.length).toEqual(24);
      expect(hash).toEqual(expectedHash);

      done();
    });

    it("should compute constant hash of an activity", done => {
      // Given
      const activity: Partial<SyncedActivityModel> = {
        id: "fakeId",
        name: "Fake name",
        type: ElevateSport.Ride,
        start_time: "2020-10-28T20:46:48.547Z",
        end_time: "2020-10-28T22:46:48.547Z",
        distance_raw: 61000,
        moving_time_raw: 7100,
        elapsed_time_raw: 7200,
        hasPowerMeter: false,
        trainer: false,
        commute: false,
        elevation_gain_raw: 780,
        start_timestamp: 11111111111,
        extendedStats: { cadenceData: null, calories: 1456 } as any,
        athleteSnapshot: new AthleteSnapshotModel(Gender.MEN, 30, AthleteSettingsModel.DEFAULT_MODEL),
        sourceConnectorType: ConnectorType.FILE,
        latLngCenter: [111, 222]
      };

      const activityShuffled: Partial<SyncedActivityModel> = {
        type: activity.type,
        start_time: activity.start_time,
        end_time: activity.end_time,
        latLngCenter: activity.latLngCenter,
        elevation_gain_raw: activity.elevation_gain_raw,
        distance_raw: activity.distance_raw,
        athleteSnapshot: activity.athleteSnapshot,
        moving_time_raw: activity.moving_time_raw,
        elapsed_time_raw: activity.elapsed_time_raw,
        hasPowerMeter: activity.hasPowerMeter,
        trainer: activity.trainer,
        id: activity.id,
        commute: activity.commute,
        start_timestamp: activity.start_timestamp,
        name: activity.name,
        extendedStats: activity.extendedStats,
        sourceConnectorType: activity.sourceConnectorType
      };

      // When
      const hash = BaseConnector.activityHash(activity);
      const hashFromShuffled = BaseConnector.activityHash(activityShuffled);

      // Then
      expect(hash).toEqual(hashFromShuffled);
      done();
    });
  });

  describe("Provide activity geo barycenter", () => {
    it("should find bary center of a geo stream", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: [
          [0, 0],
          [10, 20],
          [20, 0]
        ]
      };

      // When
      const latLngCenter: number[] = BaseConnector.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toEqual([10, 10]);

      done();
    });

    it("should not find bary center of a geo stream (1)", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: []
      };

      // When
      const latLngCenter: number[] = BaseConnector.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });

    it("should not find bary center of a geo stream (2)", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: undefined
      };

      // When
      const latLngCenter: number[] = BaseConnector.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });

    it("should not find bary center of a geo stream (3)", done => {
      // Given
      const streams = undefined;

      // When
      const latLngCenter: number[] = BaseConnector.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });
  });
});
