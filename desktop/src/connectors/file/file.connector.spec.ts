import { FileConnector } from "./file.connector";
import fs from "fs";
import path from "path";
import _ from "lodash";
import xmldom from "@xmldom/xmldom";
import { filter } from "rxjs/operators";
import { Subject } from "rxjs";
import { SportsLib } from "@thomaschampagne/sports-lib";
import { ActivityInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.interface";
import { FileConnectorConfig } from "../connector-config.model";
import { container } from "tsyringe";
import { Hash } from "../../tools/hash";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { ActivityFile } from "./activity-file.model";
import { SportsLibProcessor } from "../../processors/sports-lib.processor";
import { ActivityComputeProcessor } from "../../processors/activity-compute/activity-compute.processor";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import BaseUserSettings = UserSettings.BaseUserSettings;
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
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new FileConnectorInfo(activitiesLocalPath01)
    };

    fileConnector = fileConnector.configure(fileConnectorConfig);
    syncFilesSpy = spyOn(fileConnector, "syncFiles").and.callThrough();

    // Avoid worker use for sports-lib computation. Do it directly..
    spyOn(fileConnector, "computeSportsLibEvent").and.callFake((activityFile: ActivityFile) => {
      return SportsLibProcessor.getEvent(activityFile.location.path);
    });

    // Same for activity computing: avoid worker use
    spyOn(fileConnector, "computeActivity").and.callFake(
      (
        activity: Partial<Activity>,
        athleteSnapshot: AthleteSnapshot,
        userSettings: BaseUserSettings,
        streams: Streams,
        deflateStreams: boolean
      ) => {
        return ActivityComputeProcessor.compute(activity, athleteSnapshot, userSettings, streams, deflateStreams);
      }
    );

    done();
  });

  describe("Extract compressed activities files", () => {
    it("should extract a compressed activity (delete archive = false)", done => {
      // Given
      const archiveFileName = "samples.zip";
      const archiveFilePath = compressedActivitiesPath + archiveFileName;
      const archiveFileNameFP = Hash.apply(archiveFileName, Hash.SHA256, { divide: 6 });
      const expectedDecompressedFiles = [
        compressedActivitiesPath + archiveFileNameFP + "-11111.fit",
        compressedActivitiesPath + archiveFileNameFP + "-22222.fit",
        compressedActivitiesPath +
          archiveFileNameFP +
          "-" +
          Hash.apply("/subfolder", Hash.SHA256, { divide: 6 }) +
          "-33333.fit"
      ];
      const unlinkSyncSpy = spyOn(fileConnector.getFs(), "unlinkSync").and.callThrough();
      const deleteArchive = false;

      // When
      const promise: Promise<string[]> = fileConnector.inflateActivitiesFromArchive(archiveFilePath, deleteArchive);

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

      const rmSyncSpy = spyOn(fileConnector.getFs(), "rmSync").and.callThrough();

      // When
      const promise: Promise<string[]> = fileConnector.inflateActivitiesFromArchive(archiveFilePath, deleteArchive);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err).toEqual(expectedErrorMessage);
          expect(rmSyncSpy).toHaveBeenCalledTimes(1);
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
      const rmSyncSpy = spyOn(fileConnector.getFs(), "rmSync").and.callThrough();
      const deleteArchive = false;

      // When
      const promise: Promise<string[]> = fileConnector.inflateActivitiesFromArchive(archiveFilePath, deleteArchive);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here");
        },
        err => {
          expect(err.message).toEqual(expectedErrorMessage);
          expect(rmSyncSpy).toBeCalled();
          done();
        }
      );
    });

    it("should extract all activities compressed in a directory", done => {
      // Given
      const deleteArchives = true;
      const inflateNotifier = new Subject<string>();
      const recursive = true;
      const notifierNextSpy = spyOn(inflateNotifier, "next").and.callThrough();
      const unlinkSyncSpy = spyOn(fileConnector.getFs(), "unlinkSync").and.stub(); // Avoid remove test archive files with stubbing
      const inflateActivitiesInArchiveSpy = spyOn(fileConnector, "inflateActivitiesFromArchive").and.callThrough();

      // When
      const promise: Promise<void> = fileConnector.scanInflateActivitiesFromArchives(
        compressedActivitiesPath,
        deleteArchives,
        inflateNotifier,
        recursive
      );

      // Then
      inflateNotifier.subscribe(extractedArchive => {
        expect(extractedArchive).toBeDefined();
      });

      promise.then(
        () => {
          expect(inflateActivitiesInArchiveSpy).toHaveBeenCalledTimes(3); // 3 archives
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

    it("should stop during extract of activities compressed in a directory", done => {
      // Given
      const deleteArchives = true;
      const inflateNotifier = new Subject<string>();
      const recursive = true;
      const notifierNextSpy = spyOn(inflateNotifier, "next").and.callThrough();
      const unlinkSyncSpy = spyOn(fileConnector.getFs(), "unlinkSync").and.stub(); // Avoid remove test archive files with stubbing
      const inflateActivitiesInArchiveSpy = spyOn(fileConnector, "inflateActivitiesFromArchive").and.callThrough();

      // When
      const promise: Promise<void> = fileConnector.scanInflateActivitiesFromArchives(
        compressedActivitiesPath,
        deleteArchives,
        inflateNotifier,
        recursive
      );

      // Then
      inflateNotifier.subscribe(extractedArchive => {
        if (extractedArchive.endsWith("samples.7z")) {
          fileConnector.stopRequested = true; // Emulate a stop at second archive
        }
        expect(extractedArchive).toBeDefined();
      });

      promise.then(
        () => {
          throw new Error("Whoops");
        },
        err => {
          expect(err instanceof StoppedSyncEvent).toBeTruthy();
          expect(inflateActivitiesInArchiveSpy).toHaveBeenCalledTimes(2); // 2 archives
          expect(notifierNextSpy).toHaveBeenCalledTimes(2); // 2 archives
          expect(unlinkSyncSpy).toHaveBeenCalledTimes(2); // 2 archives

          const activityFiles = fileConnector.scanForActivities(compressedActivitiesPath, null, true);
          expect(activityFiles.length).toEqual(6);
          activityFiles.forEach(activityFile => {
            expect(fs.existsSync(activityFile.location.path)).toBeTruthy();
            unlinkSyncSpy.and.callThrough();
            fs.unlinkSync(activityFile.location.path);
            expect(fs.existsSync(activityFile.location.path)).toBeFalsy();
          });
          done();
        }
      );
    });
  });

  describe("Scan activities files", () => {
    it("should provide sha256 of activity file", done => {
      // Given
      const sha256 = "b97059d52d79aae26cd3fef0d01603bb2f722b2ed3cd9f1a802adb58afd0b443";
      const data = "john doo";

      // When
      const hashResult = Hash.apply(data);

      // Then
      expect(hashResult).toEqual(sha256);
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
      spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
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
      const syncEvents$NextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
      const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

      // Then
      syncEvent$.subscribe(
        () => {
          // Nothing...
        },
        error => {
          expect(error).toBeDefined();
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(new StoppedSyncEvent(ConnectorType.FILE));
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
      fileConnector.stopRequested = false;

      // When
      const promise = fileConnector.stop();

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        error => {
          console.warn(error);
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
      const findActivityModelsSpy = spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
      const mapActivityStreamsSpy = spyOn(fileConnector, "mapStreams").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvents$, "next").and.stub();

      const expectedName = "Afternoon Ride";
      const expectedStartTime = "2019-08-15T11:10:49.000Z";
      const expectedStartTimeStamp = new Date(expectedStartTime).getTime() / 1000;
      const expectedEndTime = "2019-08-15T14:06:03.000Z";
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

          expect(findActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(findActivityModelsSpy).toHaveBeenNthCalledWith(
            1,
            "2019-08-11T12:52:20.000Z",
            "2019-08-11T14:57:26.000Z"
          );

          expect(mapActivityStreamsSpy).toHaveBeenCalledTimes(15);

          const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
          expect(activitySyncEvent).not.toBeNull();
          expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.deflatedStreams).toBeDefined();
          expect(activitySyncEvent.isNew).toBeTruthy();

          expect(activitySyncEvent.activity.startTime).toEqual(expectedStartTime);
          expect(activitySyncEvent.activity.startTimestamp).toEqual(expectedStartTimeStamp);
          expect(activitySyncEvent.activity.endTime).toEqual(expectedEndTime);
          expect(activitySyncEvent.activity.name).toEqual(expectedName);
          expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
          expect(activitySyncEvent.activity.hasPowerMeter).toBeFalsy();
          expect(activitySyncEvent.activity.trainer).toBeFalsy();
          expect(Math.floor(activitySyncEvent.activity.srcStats.distance)).toEqual(59853);
          expect(activitySyncEvent.activity.srcStats.movingTime).toEqual(10330);
          expect(activitySyncEvent.activity.srcStats.elapsedTime).toEqual(10514);
          expect(activitySyncEvent.activity.srcStats.elevationGain).toEqual(685);
          expect(activitySyncEvent.activity.connector).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.activity.extras.file.path).toContain(expectedActivityFilePathMatch);
          expect(activitySyncEvent.activity.athleteSnapshot).toEqual(
            fileConnector.athleteSnapshotResolver.getCurrent()
          );
          expect(activitySyncEvent.activity.stats).not.toBeNull();

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

      const expectedExistingActivity = new Activity();
      expectedExistingActivity.name = "Existing activity";
      expectedExistingActivity.type = ElevateSport.Ride;
      const expectedActivitySyncEvent = new ActivitySyncEvent(
        ConnectorType.FILE,
        null,
        expectedExistingActivity,
        false
      );
      const findActivityModelsSpy = spyOn(fileConnector, "findLocalActivities").and.callFake(
        (activityStartDate: string) => {
          expectedExistingActivity.startTime = activityStartDate;
          return Promise.resolve([expectedExistingActivity]);
        }
      );
      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const mapActivityStreamsSpy = spyOn(fileConnector, "mapStreams").and.callThrough();
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

          expect(findActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
          expect(mapActivityStreamsSpy).toHaveBeenCalledTimes(0);

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

      const expectedExistingActivity = new Activity();
      expectedExistingActivity.name = "Existing activity";
      expectedExistingActivity.type = ElevateSport.Ride;
      const findActivityModelsSpy = spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const mapActivityStreamsSpy = spyOn(fileConnector, "mapStreams").and.callThrough();
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

          expect(findActivityModelsSpy).toHaveBeenCalledTimes(4);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(4);
          expect(mapActivityStreamsSpy).toHaveBeenCalledTimes(4);
          expect(syncEventNextSpy).toHaveBeenCalledTimes(5);

          const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
          expect(activitySyncEvent).not.toBeNull();
          expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
          expect(activitySyncEvent.deflatedStreams).toBeDefined();
          expect(activitySyncEvent.isNew).toBeTruthy();
          expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
          expect(activitySyncEvent.activity.startTime).toEqual("2019-08-15T11:10:49.000Z");

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
      const expectedExistingActivity = new Activity();
      expectedExistingActivity.name = "Existing activity";
      expectedExistingActivity.type = ElevateSport.Ride;
      expectedExistingActivity.startTime = new Date().toISOString();

      // Emulate 1 existing activity
      const findActivityModelsSpy = spyOn(fileConnector, "findLocalActivities").and.callFake(() => {
        return Promise.resolve([expectedExistingActivity, expectedExistingActivity]);
      });

      const createBareActivitySpy = spyOn(fileConnector, "createBareActivity").and.callThrough();
      const mapActivityStreamsSpy = spyOn(fileConnector, "mapStreams").and.callThrough();
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

          expect(findActivityModelsSpy).toHaveBeenCalledTimes(15);
          expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
          expect(mapActivityStreamsSpy).toHaveBeenCalledTimes(0);

          expect(syncEventNextSpy).toHaveBeenCalledTimes(16);

          syncEventNextSpy.calls.argsFor(1).forEach((errorSyncEvent: ErrorSyncEvent) => {
            expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code);
            expect(errorSyncEvent.fromConnectorType).toEqual(ConnectorType.FILE);
            expect(errorSyncEvent.description).toContain(expectedActivityNameToCreate);
            expect(errorSyncEvent.description).toContain(expectedExistingActivity.type);
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
      const errorMessage = "Unable to convert sport";

      fileConnectorConfig.syncFromDateTime = syncFromDateTime;
      fileConnectorConfig.info.sourceDirectory = activitiesLocalPath02;
      fileConnectorConfig.info.scanSubDirectories = true;
      fileConnectorConfig.info.extractArchiveFiles = true;
      fileConnectorConfig.info.deleteArchivesAfterExtract = false;

      fileConnector = fileConnector.configure(fileConnectorConfig);

      spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
      spyOn(fileConnector, "scanInflateActivitiesFromArchives").and.callThrough();
      spyOn(fileConnector, "scanForActivities").and.callThrough();
      spyOn(SportsLib, "importFromGPX").and.callThrough();
      spyOn(SportsLib, "importFromTCX").and.callThrough();
      spyOn(SportsLib, "importFromFit").and.callThrough();

      spyOn(fileConnector, "convertToElevateSport").and.callFake((sportsLibActivity: ActivityInterface) => {
        if (new Date(sportsLibActivity.startDate).toISOString() === "2019-08-11T12:52:20.000Z") {
          throw new Error(errorMessage);
        }
        return {
          type: (FileConnector as any).SPORTS_LIB_TO_ELEVATE_SPORTS_MAP.get(sportsLibActivity.type),
          autoDetected: false
        };
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

      spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
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
        const sportsLibActivity = event.getFirstActivity().toJSON();

        // When
        const bareActivity = fileConnector.createBareActivity(sportsLibActivity);

        // Then
        expect(bareActivity.type).toEqual(ElevateSport.Ride);
        expect(bareActivity.name).toEqual(expectedName);
        expect(bareActivity.startTime).toEqual(startISODate);
        expect(bareActivity.endTime).toEqual(endISODate);
        expect(bareActivity.hasPowerMeter).toEqual(false);
        expect(bareActivity.trainer).toEqual(false);
        expect(bareActivity.commute).toEqual(null);
        done();
      });
    });

    describe("Find elevate sport type", () => {
      it("should convert known 'sports-lib' type to ElevateSport", done => {
        // Given
        const sportsLibActivity: ActivityJSONInterface = { type: "Cycling" } as ActivityJSONInterface;
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
    });
  });

  describe("Activity streams", () => {
    describe("Extract streams form sport-libs", () => {
      it("should convert sports-lib cycling streams (with cadence, power, heartrate) to Streams", done => {
        // Given
        const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
        const expectedSamplesLength = 3179;

        SportsLibProcessor.getEvent(filePath).then(result => {
          // When
          const streams: Streams = fileConnector.mapStreams(result.event.activities[0]);

          // Then
          expect(streams.time.length).toEqual(expectedSamplesLength);
          expect(streams.latlng.length).toEqual(expectedSamplesLength);
          expect(streams.latlng[0]).toEqual([45.21027219, 5.78329785]);
          expect(streams.distance.length).toEqual(expectedSamplesLength);
          expect(streams.altitude.length).toEqual(expectedSamplesLength);
          expect(streams.velocity_smooth.length).toEqual(expectedSamplesLength);
          expect(streams.heartrate.length).toEqual(expectedSamplesLength);
          expect(streams.cadence.length).toEqual(expectedSamplesLength);
          expect(streams.watts).toBeUndefined();
          expect(streams.grade_adjusted_speed).toBeUndefined();

          done();
        });
      });
    });
  });
});
