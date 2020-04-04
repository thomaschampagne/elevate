import { ActivityFile, ActivityFileType, FileSystemConnector } from "./file-system.connector";
import {
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteModel,
	AthleteSettingsModel,
	AthleteSnapshotModel,
	BareActivityModel,
	ConnectorSyncDateTime,
	EnvTarget,
	Gender,
	SyncedActivityModel,
	UserSettings
} from "@elevate/shared/models";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as xmldom from "xmldom";
import { ActivitySyncEvent, ConnectorType, ErrorSyncEvent, StartedSyncEvent, StoppedSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { filter } from "rxjs/operators";
import { Subject } from "rxjs";
import { ElevateSport } from "@elevate/shared/enums";
import { BaseConnector, PrimitiveSourceData } from "../base.connector";
import { SportsLib } from "@sports-alliance/sports-lib";
import { ActivityInterface } from "@sports-alliance/sports-lib/lib/activities/activity.interface";
import { DataCadence } from "@sports-alliance/sports-lib/lib/data/data.cadence";
import { Activity } from "@sports-alliance/sports-lib/lib/activities/activity";
import { DataHeartRate } from "@sports-alliance/sports-lib/lib/data/data.heart-rate";
import { Creator } from "@sports-alliance/sports-lib/lib/creators/creator";
import { ActivityTypes } from "@sports-alliance/sports-lib/lib/activities/activity.types";
import { DataPower } from "@sports-alliance/sports-lib/lib/data/data.power";

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

describe("FileSystemConnector", () => {

	const defaultsByEnvTarget = UserSettings.getDefaultsByEnvTarget(EnvTarget.DESKTOP);
	const activitiesLocalPath_01 = __dirname + "/fixtures/activities-01/";
	const activitiesLocalPath_02 = __dirname + "/fixtures/activities-02/";
	const compressedActivitiesPath = __dirname + "/fixtures/compressed-activities/";
	const connectorSyncDateTime = null;

	let fileSystemConnector: FileSystemConnector;
	let syncFilesSpy: jasmine.Spy;

	beforeEach((done: Function) => {
		fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
			connectorSyncDateTime, activitiesLocalPath_01);
		syncFilesSpy = spyOn(fileSystemConnector, "syncFiles").and.callThrough();
		done();
	});

	describe("Extract compressed activities files", () => {

		it("should extract a compressed activity (delete archive = false)", (done: Function) => {
			// Given
			const archiveFileName = "samples.zip";
			const archiveFilePath = compressedActivitiesPath + archiveFileName;
			const archiveFileNameFP = BaseConnector.hashData(archiveFileName, 6);
			const expectedDecompressedFiles = [
				compressedActivitiesPath + archiveFileNameFP + "-11111.fit",
				compressedActivitiesPath + archiveFileNameFP + "-22222.fit",
				compressedActivitiesPath + archiveFileNameFP + "-" + BaseConnector.hashData("/subfolder", 6) + "-33333.fit",
			];
			const unlinkSyncSpy = spyOn(fs, "unlinkSync").and.callThrough();
			const deleteArchive = false;

			// When
			const promise: Promise<string[]> = fileSystemConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

			// Then
			promise.then(results => {
				expect(results.length).toEqual(3);
				expect(results).toEqual(expectedDecompressedFiles);
				expect(unlinkSyncSpy).not.toHaveBeenCalled();
				expectedDecompressedFiles.forEach(filePath => {
					expect(fs.existsSync(filePath)).toBeTruthy();
					fs.unlinkSync(filePath);
					expect(fs.existsSync(filePath)).toBeFalsy();
				});
				done();
			}, err => {
				throw new Error(err);
			});
		});

		it("should extract a compressed activity (delete archive = true)", (done: Function) => {
			// Given
			const archiveFileName = "samples.tar.xz";
			const archiveFileNameCopy = "samples-copy.tar.xz";
			const archiveFilePath = compressedActivitiesPath + archiveFileName;
			const archiveFilePathCopy = compressedActivitiesPath + archiveFileNameCopy;

			// Create a copy
			fs.copyFileSync(archiveFilePath, archiveFilePathCopy);
			const unlinkSyncSpy = spyOn(fs, "unlinkSync").and.callThrough();
			const deleteArchive = true;

			// When
			const promise: Promise<string[]> = fileSystemConnector.deflateActivitiesFromArchive(archiveFilePathCopy, deleteArchive);

			// Then
			promise.then(results => {
				expect(results.length).toEqual(3);
				expect(unlinkSyncSpy).toHaveBeenCalledWith(archiveFilePathCopy);
				expect(fs.existsSync(archiveFilePathCopy)).toBeFalsy();
				results.forEach(filePath => {
					expect(fs.existsSync(filePath)).toBeTruthy();
					fs.unlinkSync(filePath);
					expect(fs.existsSync(filePath)).toBeFalsy();
				});

				done();
			}, err => {
				fs.unlinkSync(archiveFilePathCopy);
				throw new Error(err);
			});
		});

		it("should reject on extraction error", (done: Function) => {

			// Given
			const archiveFileName = "samples.zip";
			const archiveFilePath = compressedActivitiesPath + archiveFileName;
			const expectedErrorMessage = "Whoops an extraction error";
			spyOn(FileSystemConnector.getAllUnPacker(), "unpack").and.callFake((filePath, options, callback) => {
				callback(expectedErrorMessage);
			});
			const deleteArchive = false;

			const rmdirSyncSpy = spyOn(fs, "rmdirSync").and.callThrough();

			// When
			const promise: Promise<string[]> = fileSystemConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

			// Then
			promise.then(() => {
				throw new Error("Should not be here");
			}, err => {
				expect(err).toEqual(expectedErrorMessage);
				expect(rmdirSyncSpy).toHaveBeenCalledTimes(1);
				done();
			});

		});

		it("should reject on moving extracted files", (done: Function) => {

			// Given
			const archiveFileName = "samples.zip";
			const archiveFilePath = compressedActivitiesPath + archiveFileName;
			const expectedErrorMessage = "Whoops a move error";
			spyOn(fs, "renameSync").and.callFake(() => {
				throw new Error(expectedErrorMessage);
			});
			const rmdirSyncSpy = spyOn(fs, "rmdirSync").and.callThrough();
			const deleteArchive = false;

			// When
			const promise: Promise<string[]> = fileSystemConnector.deflateActivitiesFromArchive(archiveFilePath, deleteArchive);

			// Then
			promise.then(() => {
				throw new Error("Should not be here");
			}, err => {
				expect(err.message).toEqual(expectedErrorMessage);
				expect(rmdirSyncSpy).toBeCalled();
				done();
			});

		});

		it("should extract all activities compressed in a directory", (done: Function) => {

			// Given
			const deleteArchives = true;
			const deflateNotifier = new Subject<string>();
			const recursive = true;
			const notifierNextSpy = spyOn(deflateNotifier, "next").and.callThrough();
			const unlinkSyncSpy = spyOn(fs, "unlinkSync").and.stub(); // Avoid remove test archive files with stubbing
			const deflateActivitiesInArchiveSpy = spyOn(fileSystemConnector, "deflateActivitiesFromArchive").and.callThrough();

			// When
			const promise: Promise<void> = fileSystemConnector.scanDeflateActivitiesFromArchives(compressedActivitiesPath, deleteArchives, deflateNotifier, recursive);

			// Then
			deflateNotifier.subscribe(extractedArchive => {
				expect(extractedArchive).toBeDefined();
			});

			promise.then(() => {
				expect(deflateActivitiesInArchiveSpy).toHaveBeenCalledTimes(4); // 4 archives
				expect(notifierNextSpy).toHaveBeenCalledTimes(4); // 4 archives
				expect(unlinkSyncSpy).toHaveBeenCalledTimes(4); // 4 archives

				const activityFiles = fileSystemConnector.scanForActivities(compressedActivitiesPath, null, true);
				expect(activityFiles.length).toEqual(12);
				activityFiles.forEach(activityFile => {
					expect(fs.existsSync(activityFile.location.path)).toBeTruthy();
					unlinkSyncSpy.and.callThrough();
					fs.unlinkSync(activityFile.location.path);
					expect(fs.existsSync(activityFile.location.path)).toBeFalsy();
				});

				done();
			}, err => {
				throw err;
			});
		});

	});

	describe("Scan activities files", () => {

		it("should provide sha1 of activity file", (done: Function) => {
			// Given
			const sha1 = "290c2e7bf875802199e8c99bab3a3d23a4c6b5cf";
			const data = "john doo";

			// When
			const hashResult = BaseConnector.hashData(data);

			// Then
			expect(hashResult).toEqual(sha1);
			done();
		});

		it("should provide a list of compatible activities files (gpx, tcx, fit) from a given directory (no sub-directories scan)",
			(done: Function) => {

				// Given
				fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
					connectorSyncDateTime, activitiesLocalPath_01);
				const expectedLength = 2;

				// When
				const activityFiles: ActivityFile[] = fileSystemConnector.scanForActivities(activitiesLocalPath_01);

				// Then
				expect(activityFiles.length).toEqual(expectedLength);

				const ride_gpx = _.find(activityFiles, {type: ActivityFileType.GPX});
				expect(ride_gpx).toBeDefined();
				expect(fs.existsSync(ride_gpx.location.path)).toBeTruthy();
				expect(ride_gpx.location.onMachineId).not.toBeNull();
				expect(_.isString(ride_gpx.lastModificationDate)).toBeTruthy();

				const virtual_ride_gpx = _.find(activityFiles, {type: ActivityFileType.FIT});
				expect(virtual_ride_gpx).toBeDefined();
				expect(fs.existsSync(virtual_ride_gpx.location.path)).toBeTruthy();

				const run_tcx = _.find(activityFiles, {type: ActivityFileType.TCX});
				expect(run_tcx).toBeUndefined();

				const activity_fake = _.find(activityFiles, {type: <ActivityFileType> "fake"});
				expect(activity_fake).toBeUndefined();
				done();
			});

		it("should provide a list of compatible activities files (gpx, tcx, fit) from a given directory (with sub-directories scan)",
			(done: Function) => {

				// Given
				fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
					connectorSyncDateTime, activitiesLocalPath_01);
				const recursive = true;
				const expectedLength = 3;

				// When
				const activityFiles: ActivityFile[] = fileSystemConnector.scanForActivities(activitiesLocalPath_01, null, recursive);

				// Then
				expect(activityFiles.length).toEqual(expectedLength);

				const ride_gpx = _.find(activityFiles, {type: ActivityFileType.GPX});
				expect(ride_gpx).toBeDefined();
				expect(ride_gpx.location.onMachineId).not.toBeNull();
				expect(fs.existsSync(ride_gpx.location.path)).toBeTruthy();

				const virtual_ride_gpx = _.find(activityFiles, {type: ActivityFileType.FIT});
				expect(virtual_ride_gpx).toBeDefined();
				expect(fs.existsSync(virtual_ride_gpx.location.path)).toBeTruthy();

				const run_tcx = _.find(activityFiles, {type: ActivityFileType.TCX});
				expect(run_tcx).toBeDefined();
				expect(fs.existsSync(run_tcx.location.path)).toBeTruthy();

				const activity_fake = _.find(activityFiles, {type: <ActivityFileType> "fake"});
				expect(activity_fake).toBeUndefined();
				done();

			});

		it("should provide a list of compatible activities files (gpx, tcx, fit) after a given date", (done: Function) => {

			// Given
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				connectorSyncDateTime, activitiesLocalPath_01);
			const expectedLength = 2;
			const afterDate = new Date("2020-01-10T09:00:00.000Z");
			const filesDate = new Date("2020-01-10T10:00:00.000Z");
			const oldDate = new Date("2020-01-05T09:00:00.000Z");
			const recursive = true;

			const getLastAccessDateSpy = spyOn(fileSystemConnector, "getLastAccessDate").and.callFake(absolutePath => {
				if (path.basename(absolutePath) === "virtual_ride.fit") { // This file should not be returned
					return oldDate;
				}
				return filesDate;
			});

			// When
			const activityFiles: ActivityFile[] = fileSystemConnector.scanForActivities(activitiesLocalPath_01, afterDate, recursive);

			// Then
			expect(activityFiles.length).toEqual(expectedLength);

			const ride_gpx = _.find(activityFiles, {type: ActivityFileType.GPX});
			expect(ride_gpx).toBeDefined();
			expect(fs.existsSync(ride_gpx.location.path)).toBeTruthy();

			const run_tcx = _.find(activityFiles, {type: ActivityFileType.TCX});
			expect(run_tcx).toBeDefined();
			expect(fs.existsSync(run_tcx.location.path)).toBeTruthy();

			const virtual_ride_gpx = _.find(activityFiles, {type: ActivityFileType.FIT});
			expect(virtual_ride_gpx).toBeUndefined();

			expect(getLastAccessDateSpy).toHaveBeenCalledTimes(3);
			done();
		});

	});

	describe("Root sync", () => {

		beforeEach((done: Function) => {
			spyOn(fileSystemConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
			done();
		});

		it("should complete the sync", (done: Function) => {

			// Given
			const expectedStartedSyncEvent = new StartedSyncEvent(ConnectorType.FILE_SYSTEM);
			const expectedCompleteCalls = 1;
			let startedSyncEventToBeCaught = null;

			// When
			const syncEvent$ = fileSystemConnector.sync();
			const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

			// Then
			syncEvent$.subscribe((syncEvent: SyncEvent) => {

				if (syncEvent.type === SyncEventType.STARTED) {
					startedSyncEventToBeCaught = syncEvent;
				}

				expect(fileSystemConnector.isSyncing).toBeTruthy();

			}, error => {

				expect(error).not.toBeDefined();
				throw new Error(error);

			}, () => {

				expect(startedSyncEventToBeCaught).toEqual(expectedStartedSyncEvent);
				expect(fileSystemConnector.isSyncing).toBeFalsy();
				expect(syncFilesSpy).toBeCalledTimes(1);
				expect(syncEvents$CompleteSpy).toBeCalledTimes(expectedCompleteCalls);
				done();

			});

		});

		it("should stop sync and notify error when syncFiles() reject an 'Unhandled error'", (done: Function) => {

			// Given
			const expectedErrorSync = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.FILE_SYSTEM, "Unhandled error");
			syncFilesSpy.and.returnValue(Promise.reject(expectedErrorSync));

			// When
			const syncEvent$ = fileSystemConnector.sync();
			const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
			const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

			// Then
			syncEvent$.subscribe((syncEvent: SyncEvent) => {
				/*
				todo?!
				if (syncEvent.type !== SyncEventType.STARTED) {
								expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
								expect((<ActivitySyncEvent> syncEvent).activity).toBeDefined();
							}
			*/
				expect(fileSystemConnector.isSyncing).toBeTruthy();

			}, error => {
				expect(error).toBeDefined();
				expect(syncFilesSpy).toBeCalledTimes(1);
				expect(syncEvents$CompleteSpy).not.toBeCalled();
				expect(syncEvents$ErrorsSpy).toBeCalledTimes(1);
				expect(fileSystemConnector.isSyncing).toBeFalsy();

				done();

			}, () => {
				throw new Error("Test failed!");
			});

		});

		it("should reject sync if connector is already syncing", (done: Function) => {

			// Given
			const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.FILE_SYSTEM);
			const syncEvent$01 = fileSystemConnector.sync(); // Start a first sync

			// When
			const syncEvents$NextSpy = spyOn(syncEvent$01, "next").and.callThrough();
			const syncEvent$02 = fileSystemConnector.sync(); // Start a 2nd one.

			// Then
			syncEvent$01.subscribe(() => {

				expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);

			}, () => {

				throw new Error("Test failed!");

			}, () => {

				expect(syncEvent$01).toEqual(syncEvent$02);
				expect(syncEvent$01.isStopped).toBeTruthy();
				expect(syncEvent$02.isStopped).toBeTruthy();
				expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
				done();
			});
		});

	});

	describe("Stop sync", () => {

		it("should stop a processing sync", (done: Function) => {

			// Given
			const stopSyncEventReceived = [];
			const expectedStoppedSyncEvent = new StoppedSyncEvent(ConnectorType.FILE_SYSTEM);
			const expectedStoppedSyncEventReceived = 1;

			const syncEvent$ = fileSystemConnector.sync();
			syncEvent$.pipe(
				filter(syncEvent => syncEvent.type === SyncEventType.STOPPED)
			).subscribe((syncEvent: StoppedSyncEvent) => {
				stopSyncEventReceived.push(syncEvent);
			});

			// When
			const promise = fileSystemConnector.stop();

			// Then
			expect(fileSystemConnector.stopRequested).toBeTruthy();
			expect(fileSystemConnector.isSyncing).toBeTruthy();
			promise.then(() => {
				expect(stopSyncEventReceived.length).toEqual(expectedStoppedSyncEventReceived);
				expect(stopSyncEventReceived[0]).toEqual(expectedStoppedSyncEvent);
				expect(fileSystemConnector.stopRequested).toBeFalsy();
				expect(fileSystemConnector.isSyncing).toBeFalsy();
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});

		});

		it("should reject a stop request when no sync is processed", (done: Function) => {

			// Given
			fileSystemConnector.isSyncing = false;

			// When
			const promise = fileSystemConnector.stop();

			// Then
			expect(fileSystemConnector.stopRequested).toBeTruthy();
			expect(fileSystemConnector.isSyncing).toBeFalsy();
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, () => {
				expect(fileSystemConnector.isSyncing).toBeFalsy();
				expect(fileSystemConnector.stopRequested).toBeFalsy();
				done();
			});
		});

	});

	describe("Sync files", () => {

		it("should sync fully an input folder never synced before", (done: Function) => {

			// Given
			const syncDateTime = null; // Never synced before !!
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = true;
			const deleteArchivesAfterExtract = false;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);

			const scanDeflateActivitiesFromArchivesSpy = spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			const scanForActivitiesSpy = spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
			const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
			const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();
			const findSyncedActivityModelsSpy = spyOn(fileSystemConnector, "findSyncedActivityModels")
				.and.returnValue(Promise.resolve(null));
			const extractActivityStreamsSpy = spyOn(fileSystemConnector, "extractActivityStreams").and.callThrough();
			const computeAdditionalStreamsSpy = spyOn(fileSystemConnector, "computeAdditionalStreams").and.callThrough();
			const updatePrimitiveStatsFromComputationSpy = spyOn(BaseConnector, "updatePrimitiveStatsFromComputation").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			const expectedName = "Afternoon Ride";
			const expectedStartTime = "2019-08-15T11:10:49.000Z";
			const expectedStartTimeStamp = new Date(expectedStartTime).getTime() / 1000;
			const expectedEndTime = "2019-08-15T14:06:03.000Z";
			const expectedActivityId = BaseConnector.hashData(expectedStartTime, 6) + "-" + BaseConnector.hashData(expectedEndTime, 6);
			const expectedActivityFilePathMatch = "20190815_ride_3953195468.tcx";

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {

				expect(scanDeflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, deleteArchivesAfterExtract, jasmine.any(Subject), scanSubDirectories);
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDateTime, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(findSyncedActivityModelsSpy).toHaveBeenNthCalledWith(1, "2019-08-11T12:52:20.000Z", 7263.962);

				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(15);
				expect(computeAdditionalStreamsSpy).toHaveBeenCalledTimes(15);
				expect(updatePrimitiveStatsFromComputationSpy).toHaveBeenCalledTimes(15);

				const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
				expect(activitySyncEvent).not.toBeNull();
				expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(activitySyncEvent.compressedStream).toBeDefined();
				expect(activitySyncEvent.isNew).toBeTruthy();

				expect(activitySyncEvent.activity.start_time).toEqual(expectedStartTime);
				expect(activitySyncEvent.activity.start_timestamp).toEqual(expectedStartTimeStamp);
				expect(activitySyncEvent.activity.end_time).toEqual(expectedEndTime);
				expect(activitySyncEvent.activity.id).toEqual(expectedActivityId);
				expect(activitySyncEvent.activity.name).toEqual(expectedName);
				expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
				expect(activitySyncEvent.activity.hasPowerMeter).toBeFalsy();
				expect(activitySyncEvent.activity.trainer).toBeFalsy();
				expect(Math.floor(activitySyncEvent.activity.distance_raw)).toEqual(59849);
				expect(activitySyncEvent.activity.moving_time_raw).toEqual(9958);
				expect(activitySyncEvent.activity.elapsed_time_raw).toEqual(10514);
				expect(activitySyncEvent.activity.elevation_gain_raw).toEqual(685);
				expect(activitySyncEvent.activity.sourceConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(activitySyncEvent.activity.extras.fs_activity_location.onMachineId).toBeDefined();
				expect(activitySyncEvent.activity.extras.fs_activity_location.path).toContain(expectedActivityFilePathMatch);
				expect(activitySyncEvent.activity.athleteSnapshot).toEqual(fileSystemConnector.athleteSnapshotResolver.getCurrent());
				expect(activitySyncEvent.activity.extendedStats).not.toBeNull();

				expect(activitySyncEvent.compressedStream).not.toBeNull();

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should sync fully activities of an input folder already synced (no recent activities => syncDateTime = null)", (done: Function) => {

			// Given
			const syncDateTime = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = true;
			const deleteArchivesAfterExtract = false;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);

			const scanDeflateActivitiesFromArchivesSpy = spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			const scanForActivitiesSpy = spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
			const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
			const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

			const expectedExistingSyncedActivity = new SyncedActivityModel();
			expectedExistingSyncedActivity.name = "Existing activity";
			expectedExistingSyncedActivity.type = ElevateSport.Ride;
			const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, expectedExistingSyncedActivity, false);
			const findSyncedActivityModelsSpy = spyOn(fileSystemConnector, "findSyncedActivityModels")
				.and.callFake((activityStartDate: string) => {
					expectedExistingSyncedActivity.start_time = activityStartDate;
					return Promise.resolve([expectedExistingSyncedActivity]);
				});
			const createBareActivitySpy = spyOn(fileSystemConnector, "createBareActivity").and.callThrough();
			const extractActivityStreamsSpy = spyOn(fileSystemConnector, "extractActivityStreams").and.callThrough();
			const computeAdditionalStreamsSpy = spyOn(fileSystemConnector, "computeAdditionalStreams").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				expect(scanDeflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, deleteArchivesAfterExtract, jasmine.any(Subject), scanSubDirectories);
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDateTime, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);
				expect(computeAdditionalStreamsSpy).toHaveBeenCalledTimes(0);

				expect(syncEventNextSpy).toHaveBeenCalledTimes(16);
				expect(syncEventNextSpy).toHaveBeenCalledWith(expectedActivitySyncEvent);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should sync recent activities of an input folder already synced (no recent activities => syncDateTime = Date)", (done: Function) => {

			// Given
			const syncDate = new Date("2019-01-01T12:00:00.000Z");
			const syncDateTime = syncDate.getTime(); // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = true;
			const deleteArchivesAfterExtract = false;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);

			const scanDeflateActivitiesFromArchivesSpy = spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			const scanForActivitiesSpy = spyOn(fileSystemConnector, "scanForActivities").and.callThrough();

			// Return lastModificationDate greater than syncDateTime when file name contains "2019"
			spyOn(fileSystemConnector, "getLastAccessDate").and.callFake((absolutePath: string) => {
				return (absolutePath.match(/2019/gm))
					? new Date("2019-06-01T12:00:00.000Z") // Fake 2019 date
					: new Date("2018-06-01T12:00:00.000Z"); // Fake 2018 date
			});

			const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
			const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
			const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

			const expectedExistingSyncedActivity = new SyncedActivityModel();
			expectedExistingSyncedActivity.name = "Existing activity";
			expectedExistingSyncedActivity.type = ElevateSport.Ride;
			const findSyncedActivityModelsSpy = spyOn(fileSystemConnector, "findSyncedActivityModels")
				.and.returnValue(Promise.resolve(null));
			const createBareActivitySpy = spyOn(fileSystemConnector, "createBareActivity").and.callThrough();
			const extractActivityStreamsSpy = spyOn(fileSystemConnector, "extractActivityStreams").and.callThrough();
			const computeAdditionalStreamsSpy = spyOn(fileSystemConnector, "computeAdditionalStreams").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				expect(scanDeflateActivitiesFromArchivesSpy).not.toBeCalled();
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDate, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(2);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(1);
				expect(importFromFITSpy).toHaveBeenCalledTimes(1);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(4);
				expect(createBareActivitySpy).toHaveBeenCalledTimes(4);
				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(4);
				expect(computeAdditionalStreamsSpy).toHaveBeenCalledTimes(4);
				expect(syncEventNextSpy).toHaveBeenCalledTimes(5);

				const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(2)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
				expect(activitySyncEvent).not.toBeNull();
				expect(activitySyncEvent.fromConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(activitySyncEvent.compressedStream).toBeDefined();
				expect(activitySyncEvent.isNew).toBeTruthy();
				expect(activitySyncEvent.activity.type).toEqual(ElevateSport.Ride);
				expect(activitySyncEvent.activity.start_time).toEqual("2019-08-15T11:10:49.000Z");

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should send sync error when multiple activities are found", (done: Function) => {

			// Given
			const syncDateTime = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = true;
			const deleteArchivesAfterExtract = false;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);


			const scanDeflateActivitiesFromArchivesSpy = spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			const scanForActivitiesSpy = spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
			const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
			const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();

			const expectedActivityNameToCreate = "Afternoon Ride";
			const expectedExistingSyncedActivity = new SyncedActivityModel();
			expectedExistingSyncedActivity.name = "Existing activity";
			expectedExistingSyncedActivity.type = ElevateSport.Ride;
			expectedExistingSyncedActivity.start_time = new Date().toISOString();

			// Emulate 1 existing activity
			const findSyncedActivityModelsSpy = spyOn(fileSystemConnector, "findSyncedActivityModels")
				.and.callFake(() => {
					return Promise.resolve([expectedExistingSyncedActivity, expectedExistingSyncedActivity]);
				});

			const createBareActivitySpy = spyOn(fileSystemConnector, "createBareActivity").and.callThrough();
			const extractActivityStreamsSpy = spyOn(fileSystemConnector, "extractActivityStreams").and.callThrough();
			const computeAdditionalStreamsSpy = spyOn(fileSystemConnector, "computeAdditionalStreams").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();
			const expectedActivitiesFound = expectedExistingSyncedActivity.name + " (" + new Date(expectedExistingSyncedActivity.start_time).toString() + ")";

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				expect(scanDeflateActivitiesFromArchivesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, deleteArchivesAfterExtract, jasmine.any(Subject), scanSubDirectories);
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDateTime, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);
				expect(computeAdditionalStreamsSpy).toHaveBeenCalledTimes(0);

				expect(syncEventNextSpy).toHaveBeenCalledTimes(16);

				syncEventNextSpy.calls.argsFor(1).forEach((errorSyncEvent: ErrorSyncEvent) => {
					expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code);
					expect(errorSyncEvent.fromConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
					expect(errorSyncEvent.description).toContain(expectedActivityNameToCreate);
					expect(errorSyncEvent.description).toContain(expectedExistingSyncedActivity.type);
					expect(errorSyncEvent.description).toContain(expectedActivitiesFound);
				});

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should send sync error on compute error", (done: Function) => {

			// Given
			const syncDateTime = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = false;
			const deleteArchivesAfterExtract = false;
			const errorMessage = "Unable to create bare activity";
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);

			spyOn(fileSystemConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
			spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			spyOn(SportsLib, "importFromGPX").and.callThrough();
			spyOn(SportsLib, "importFromTCX").and.callThrough();
			spyOn(SportsLib, "importFromFit").and.callThrough();

			spyOn(fileSystemConnector, "createBareActivity").and.callFake((sportsLibActivity: ActivityInterface) => {
				if (sportsLibActivity.startDate.toISOString() === "2019-08-11T12:52:20.000Z") {
					throw new Error(errorMessage);
				}
			});

			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				throw new Error("Should not be here");
			}, errorSyncEvent => {
				expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
				expect(errorSyncEvent).toBeDefined();
				expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.SYNC_ERROR_COMPUTE.code);
				expect(errorSyncEvent.fromConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(errorSyncEvent.description).toContain(errorMessage);
				expect(errorSyncEvent.activity.type).toContain(ActivityTypes.Cycling);
				expect(errorSyncEvent.activity.extras.fs_activity_location.path).toContain("20190811_ride_3939576645.fit");
				done();
			});
		});

		it("should send sync error on parsing error", (done: Function) => {

			// Given
			const syncDateTime = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			const extractArchiveFiles = false;
			const deleteArchivesAfterExtract = false;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02, scanSubDirectories,
				false, extractArchiveFiles, deleteArchivesAfterExtract);
			const errorMessage = "Unable to parse fit file";

			spyOn(fileSystemConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
			spyOn(fileSystemConnector, "scanDeflateActivitiesFromArchives").and.callThrough();
			spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			spyOn(SportsLib, "importFromGPX").and.callThrough();
			spyOn(SportsLib, "importFromTCX").and.callThrough();
			spyOn(SportsLib, "importFromFit").and.returnValue(Promise.reject(errorMessage));
			spyOn(fileSystemConnector, "createBareActivity").and.callThrough();

			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {

				throw new Error("Should not be here");

			}, errorSyncEvent => {
				expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
				expect(errorSyncEvent).toBeDefined();
				expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.SYNC_ERROR_COMPUTE.code);
				expect(errorSyncEvent.fromConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(errorSyncEvent.description).toContain(errorMessage);
				expect(errorSyncEvent.activity.extras.fs_activity_location.path).toContain("20190811_ride_3939576645.fit");
				done();
			});
		});

		it("should send sync error if source directory do not exists", (done: Function) => {

			// Given
			const syncDateTime = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const fakeSourceDir = "/fake/dir/path";
			const expectedErrorSyncEvent = ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.create(fakeSourceDir);
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), fakeSourceDir);

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				throw new Error("Should not be here");
			}, errorSyncEvent => {
				expect(errorSyncEvent).toEqual(expectedErrorSyncEvent);
				done();
			});
		});

	});

	describe("Process bare activities", () => {

		it("should create a bare activity from a sports-lib activity", (done: Function) => {

			// Given
			const startISODate = "2019-08-15T11:10:49.000Z";
			const endISODate = "2019-08-15T14:06:03.000Z";
			const expectedId = BaseConnector.hashData(startISODate);
			const expectedName = "Afternoon Ride";
			const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";

			SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
				const sportsLibActivity = event.getFirstActivity();

				// When
				const bareActivity = fileSystemConnector.createBareActivity(sportsLibActivity);

				// Then
				expect(bareActivity.id).toEqual(expectedId);
				expect(bareActivity.type).toEqual(ElevateSport.Ride);
				expect(bareActivity.display_type).toEqual(ElevateSport.Ride);
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

			it("should convert known 'sports-lib' type to ElevateSport", (done: Function) => {
				// Given
				const sportsLibActivity: ActivityInterface = <ActivityInterface> {type: "Cycling"};
				const expectedElevateSport = ElevateSport.Ride;

				// When
				const elevateSportResult: { type: ElevateSport, autoDetected: boolean } = fileSystemConnector.convertToElevateSport(sportsLibActivity);

				// Then
				expect(elevateSportResult.type).toEqual(expectedElevateSport);

				done();
			});

			it("should convert unknown 'sports-lib' type to ElevateSport other type", (done: Function) => {
				// Given
				fileSystemConnector.detectSportTypeWhenUnknown = true;
				const sportsLibActivity: ActivityInterface = <any> {
					type: <ActivityTypes> "FakeSport", getStats: () => {
					}
				};

				spyOn(sportsLibActivity, "getStats").and.returnValue({
					get: () => {
						return {
							getValue: () => {
								return {};
							}
						};
					}
				});
				const attemptDetectCommonSportSpy = spyOn(fileSystemConnector, "attemptDetectCommonSport").and.returnValue(ElevateSport.Other);

				// When
				fileSystemConnector.convertToElevateSport(sportsLibActivity);

				// Then
				expect(attemptDetectCommonSportSpy).toHaveBeenCalledTimes(1);

				done();
			});

			it("should attempt to find Elevate Sport when type is unknown", (done: Function) => {

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
					{distance: 162, duration: 268, ascent: 3562.2, avgSpeed: 36.3, maxSpeed: 81.7, expectedSport: ElevateSport.Ride},
					{distance: 66, duration: 213, ascent: 1578, avgSpeed: 20.9, maxSpeed: 70.9, expectedSport: ElevateSport.Ride},
					{distance: 30, duration: 60, ascent: 15, avgSpeed: 30, maxSpeed: 55, expectedSport: ElevateSport.Ride},
					{distance: 17, duration: 41, ascent: 33, avgSpeed: 26, maxSpeed: 37.4, expectedSport: ElevateSport.Ride},
					{distance: 168, duration: 506, ascent: 274, avgSpeed: 28, maxSpeed: 45.3, expectedSport: ElevateSport.Ride},
					{distance: 32, duration: 70, ascent: 721, avgSpeed: 27.5, maxSpeed: 91.8, expectedSport: ElevateSport.Ride},
					{distance: 49, duration: 135, ascent: 1054.56, avgSpeed: 22.2, maxSpeed: 77, expectedSport: ElevateSport.Ride},
					{distance: 141, duration: 394, ascent: 4043.44, avgSpeed: 21.9, maxSpeed: 70.5, expectedSport: ElevateSport.Ride},
					{distance: 31, duration: 94, ascent: 525, avgSpeed: 20, maxSpeed: 56.5, expectedSport: ElevateSport.Ride},
					{distance: 44, duration: 122, ascent: 554, avgSpeed: 22.1, maxSpeed: 61.2, expectedSport: ElevateSport.Ride},
					{distance: 82, duration: 217, ascent: 1098, avgSpeed: 25.4, maxSpeed: 61.9, expectedSport: ElevateSport.Ride},
					{distance: 53, duration: 90, ascent: null, avgSpeed: 35.3, maxSpeed: 39.9, expectedSport: ElevateSport.Ride},
					{distance: 32, duration: 90, ascent: null, avgSpeed: 21.9, maxSpeed: 28.4, expectedSport: ElevateSport.Ride},
					{distance: 12, duration: 23, ascent: 20, avgSpeed: 30.8, maxSpeed: 38.1, expectedSport: ElevateSport.Ride},
					{distance: 20, duration: 79, ascent: 99, avgSpeed: 22.4, maxSpeed: 38.8, expectedSport: ElevateSport.Ride},

					// Runs
					{distance: 12, duration: 57, ascent: 226, avgSpeed: 12.8, maxSpeed: 17, expectedSport: ElevateSport.Run},
					{distance: 3, duration: 37, ascent: 16.2052, avgSpeed: 6.6, maxSpeed: 18.3, expectedSport: ElevateSport.Other}, // It's "Run" but too much doubt, then type: Other
					{distance: 6, duration: 56, ascent: 343, avgSpeed: 6.7, maxSpeed: 12, expectedSport: ElevateSport.Run},
					{distance: 6.17, duration: 34, ascent: 316, avgSpeed: 10, maxSpeed: 16.4, expectedSport: ElevateSport.Run},
					{distance: 8, duration: 38, ascent: 44.5919, avgSpeed: 13.3, maxSpeed: 21.9, expectedSport: ElevateSport.Run},
					{distance: 5, duration: 28, ascent: 10.1495, avgSpeed: 10.9, maxSpeed: 18.3, expectedSport: ElevateSport.Run},
					{distance: 4, duration: 33, ascent: 6, avgSpeed: 10.4, maxSpeed: 15.8, expectedSport: ElevateSport.Run},
					{distance: 2, duration: 28, ascent: 37, avgSpeed: 6.3, maxSpeed: 11.5, expectedSport: ElevateSport.Run},
					{distance: 12, duration: 77, ascent: 42, avgSpeed: 9.8, maxSpeed: 13.6, expectedSport: ElevateSport.Run},
					{distance: 1, duration: 25, ascent: 17.145, avgSpeed: 4.6, maxSpeed: 7.9, expectedSport: ElevateSport.Run},
					{distance: 15, duration: 62, ascent: 205.137, avgSpeed: 14.5, maxSpeed: 20.8, expectedSport: ElevateSport.Run},
					{distance: 1, duration: 14, ascent: null, avgSpeed: 6.3, maxSpeed: 12.9, expectedSport: ElevateSport.Run},
					{distance: 6, duration: 109, ascent: 594.8, avgSpeed: 4.8, maxSpeed: 10.4, expectedSport: ElevateSport.Run},
					{distance: 2, duration: 41, ascent: 12.4471, avgSpeed: 4.7, maxSpeed: 12.2, expectedSport: ElevateSport.Run},

					// Low pace Rides
					{distance: 1, duration: 6, ascent: 2, avgSpeed: 21.3, maxSpeed: 33.4, expectedSport: ElevateSport.Ride},
					{distance: 1, duration: 6, ascent: null, avgSpeed: 19.4, maxSpeed: 29.5, expectedSport: ElevateSport.Ride},
					{distance: 7, duration: 88, ascent: 55, avgSpeed: 8.4, maxSpeed: 19.8, expectedSport: ElevateSport.Other}, // It's "Ride" but too much doubt, then type: Other
					{distance: 11, duration: 111, ascent: 103.688, avgSpeed: 12.2, maxSpeed: 34.2, expectedSport: ElevateSport.Ride},
					{distance: 2, duration: 7, ascent: 14, avgSpeed: 19.9, maxSpeed: 28.8, expectedSport: ElevateSport.Ride},

					// Skiing
					{distance: 129, duration: 477, ascent: 14283, avgSpeed: 18.3, maxSpeed: 108.7, expectedSport: ElevateSport.Other},
					{distance: 100, duration: 398, ascent: 10511, avgSpeed: 17.6, maxSpeed: 144.3, expectedSport: ElevateSport.Other},
					{distance: 42, duration: 224, ascent: 3405, avgSpeed: 13.2, maxSpeed: 85.3, expectedSport: ElevateSport.Other},
					{distance: 40, duration: 297, ascent: 4477, avgSpeed: 13.2, maxSpeed: 81.3, expectedSport: ElevateSport.Other},

					// Unexpected with strange values
					{distance: 10, duration: 60, ascent: 10, avgSpeed: null, maxSpeed: null, expectedSport: ElevateSport.Other},
					{distance: null, duration: 60, ascent: 10, avgSpeed: 10, maxSpeed: 15, expectedSport: ElevateSport.Other},

				].map(testData => prepareTestData(testData));

				// When, Then
				activitiesTestData.forEach((testData, index) => {
					const elevateSport = fileSystemConnector.attemptDetectCommonSport(testData.distance, testData.duration, testData.ascent, testData.avgSpeed, testData.maxSpeed);
					expect(elevateSport).toEqual(testData.expectedSport);
				});

				done();
			});
		});

		describe("Update primitive data from computation or input source", () => {

			let syncedActivityModel: SyncedActivityModel = null;
			let activityStreamsModel: ActivityStreamsModel = null;
			const defaultMovingTime = 900;
			const defaultElapsedTime = 1000;
			const startDistance = 5;
			const endDistance = 1000;
			const defaultDistance = endDistance - startDistance;
			const defaultElevationGain = 0;

			beforeEach((done: Function) => {
				syncedActivityModel = new SyncedActivityModel();
				syncedActivityModel.extendedStats = <AnalysisDataModel> {
					movingTime: defaultMovingTime,
					elapsedTime: defaultElapsedTime,
					elevationData: {
						accumulatedElevationAscent: defaultElevationGain
					}
				};
				syncedActivityModel.athleteSnapshot = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);

				activityStreamsModel = new ActivityStreamsModel();
				activityStreamsModel.distance = [startDistance, 10, 100, endDistance];

				done();
			});

			it("should update primitive data using computed stats if available", (done: Function) => {

				// Given
				const primitiveSourceData: PrimitiveSourceData = {
					distanceRaw: 111,
					elapsedTimeRaw: 333,
					movingTimeRaw: 222,
					elevationGainRaw: 444
				};

				// When
				const result = BaseConnector.updatePrimitiveStatsFromComputation(syncedActivityModel, activityStreamsModel, primitiveSourceData);

				// Then
				expect(result.elapsed_time_raw).toEqual(defaultElapsedTime);
				expect(result.moving_time_raw).toEqual(defaultMovingTime);
				expect(result.distance_raw).toEqual(defaultDistance);
				expect(result.elevation_gain_raw).toEqual(defaultElevationGain);

				done();
			});

			it("should update primitive data using data provided by source (computation stats not available) (1)", (done: Function) => {

				// Given
				const primitiveSourceData: PrimitiveSourceData = {
					distanceRaw: 111,
					elapsedTimeRaw: 333,
					movingTimeRaw: 222,
					elevationGainRaw: 444
				};

				syncedActivityModel.extendedStats = null;
				activityStreamsModel.distance = [];

				// When
				const result = BaseConnector.updatePrimitiveStatsFromComputation(syncedActivityModel, activityStreamsModel, primitiveSourceData);

				// Then
				expect(result.elapsed_time_raw).toEqual(primitiveSourceData.elapsedTimeRaw);
				expect(result.moving_time_raw).toEqual(primitiveSourceData.movingTimeRaw);
				expect(result.distance_raw).toEqual(primitiveSourceData.distanceRaw);
				expect(result.elevation_gain_raw).toEqual(primitiveSourceData.elevationGainRaw);
				done();
			});

			it("should update primitive data using data provided by source (computation stats not available) (2)", (done: Function) => {

				// Given
				const primitiveSourceData: PrimitiveSourceData = {
					distanceRaw: 111,
					elapsedTimeRaw: 333,
					movingTimeRaw: 222,
					elevationGainRaw: 444
				};

				syncedActivityModel.extendedStats = <AnalysisDataModel> {
					movingTime: null,
					elapsedTime: null,
					pauseTime: null,
					elevationData: {
						accumulatedElevationAscent: null,
					}
				};
				activityStreamsModel.distance = [];

				// When
				const result = BaseConnector.updatePrimitiveStatsFromComputation(syncedActivityModel, activityStreamsModel, primitiveSourceData);

				// Then
				expect(result.elapsed_time_raw).toEqual(primitiveSourceData.elapsedTimeRaw);
				expect(result.moving_time_raw).toEqual(primitiveSourceData.movingTimeRaw);
				expect(result.distance_raw).toEqual(primitiveSourceData.distanceRaw);
				expect(result.elevation_gain_raw).toEqual(primitiveSourceData.elevationGainRaw);
				done();
			});

			it("should update primitive data with null values (computation stats & source not available)", (done: Function) => {

				// Given
				const primitiveSourceData: PrimitiveSourceData = {
					distanceRaw: undefined,
					elapsedTimeRaw: undefined,
					movingTimeRaw: undefined,
					elevationGainRaw: undefined
				};

				syncedActivityModel.extendedStats = <AnalysisDataModel> {
					movingTime: null,
					elapsedTime: null,
					pauseTime: null,
					elevationData: {
						accumulatedElevationAscent: null,
					}
				};

				activityStreamsModel.distance = [];

				// When
				const result = BaseConnector.updatePrimitiveStatsFromComputation(syncedActivityModel, activityStreamsModel, primitiveSourceData);

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

		describe("Estimated power streams calculation", () => {

			it("should add estimated power data stream to a cycling activities having speed and grade stream data & performed without power meter", (done: Function) => {

				// Given
				const riderWeight = 75;
				const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
				const expectedSamplesLength = 3179;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					return Promise.resolve(fileSystemConnector.extractActivityStreams(event.getFirstActivity()));
				});

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const powerEstimatedStream = fileSystemConnector.estimateCyclingPowerStream(ElevateSport.Ride, activityStreamsModel.velocity_smooth,
						activityStreamsModel.grade_smooth, riderWeight);

					// Then
					expect(powerEstimatedStream.length).toEqual(expectedSamplesLength);
					done();
				});

			});

			it("should throw error when sport type is different of Ride & VirtualRide", (done: Function) => {

				// Given, When
				const riderWeight = 80;
				const runCall = () => fileSystemConnector.estimateCyclingPowerStream(ElevateSport.Run, [1, 2, 3, 5], [1, 2, 3, 5], riderWeight);
				const alpineSkiCall = () => fileSystemConnector.estimateCyclingPowerStream(ElevateSport.AlpineSki, [1, 2, 3, 5], [1, 2, 3, 5], riderWeight);

				// Then
				expect(runCall).toThrowError();
				expect(alpineSkiCall).toThrowError();

				done();
			});

			it("should throw error when no velocity or grade stream or no weight", (done: Function) => {

				// Given, When
				const riderWeight = 80;
				const noVelocityCall = () => fileSystemConnector.estimateCyclingPowerStream(ElevateSport.Ride, [], [1, 2, 3, 5], riderWeight);
				const noGradeCall = () => fileSystemConnector.estimateCyclingPowerStream(ElevateSport.VirtualRide, [1, 2, 3, 5], [], riderWeight);
				const noWeightCall = () => fileSystemConnector.estimateCyclingPowerStream(ElevateSport.VirtualRide, [1, 2, 3, 5], [1, 2, 3, 5], null);

				// Then
				expect(noVelocityCall).toThrowError();
				expect(noGradeCall).toThrowError();
				expect(noWeightCall).toThrowError();

				done();

			});

		});

		describe("Extract streams form sport-libs", () => {

			it("should convert sports-lib streams to ActivityStreamsModel", (done: Function) => {

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
				const activityStreamsModel: ActivityStreamsModel = fileSystemConnector.extractActivityStreams(sportsLibActivity);

				// Then
				expect(activityStreamsModel.time[0]).toBeDefined();
				expect(activityStreamsModel.latlng[0]).toBeDefined();
				expect(activityStreamsModel.distance[0]).toBeDefined();
				expect(activityStreamsModel.velocity_smooth[0]).toBeDefined();
				expect(activityStreamsModel.altitude[0]).toBeDefined();
				expect(activityStreamsModel.grade_smooth[0]).toBeDefined();
				expect(activityStreamsModel.grade_adjusted_speed[0]).toBeDefined();
				expect(activityStreamsModel.heartrate).toEqual([]);
				expect(activityStreamsModel.cadence).toEqual([]);
				expect(activityStreamsModel.watts).toEqual([]);

				done();
			});

			it("should convert sports-lib cycling streams (with cadence, power, heartrate) to ActivityStreamsModel", (done: Function) => {

				// Given
				const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
				const expectedSamplesLength = 3179;

				SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					const sportsLibActivity = event.getFirstActivity();

					// When
					const activityStreamsModel: ActivityStreamsModel = fileSystemConnector.extractActivityStreams(sportsLibActivity);

					// Then
					expect(activityStreamsModel.time.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.latlng.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.latlng[0]).toEqual([45.21027219, 5.78329785]);
					expect(activityStreamsModel.distance.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.altitude.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.velocity_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.grade_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.heartrate.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.cadence.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.watts).toEqual([]); // calculated in computeAdditionalStreams
					expect(activityStreamsModel.grade_adjusted_speed).toEqual([]);

					done();
				});
			});
		});

		describe("Calculate additional streams", () => {

			it("should estimated power streams on cycling activity without power meter", (done: Function) => {

				// Given
				let bareActivityModel: BareActivityModel;
				const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
				const expectedSamplesLength = 3179;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					const sportsLibActivity = event.getFirstActivity();
					bareActivityModel = fileSystemConnector.createBareActivity(sportsLibActivity);
					return Promise.resolve(fileSystemConnector.extractActivityStreams(sportsLibActivity));
				});
				const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
				const estimateCyclingPowerStreamSpy = spyOn(fileSystemConnector, "estimateCyclingPowerStream").and.callThrough();

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const activityStreamsFullModel: ActivityStreamsModel = fileSystemConnector.computeAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

					// Then
					expect(activityStreamsFullModel.grade_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsFullModel.watts.length).toEqual(expectedSamplesLength);
					expect(activityStreamsFullModel.watts_calc).toBeUndefined();
					expect(estimateCyclingPowerStreamSpy).toHaveBeenCalledTimes(1);
					done();
				});
			});

			it("should not calculate estimated power streams on cycling activity without grade stream", (done: Function) => {

				// Given
				const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
				const bareActivityModel: BareActivityModel = new BareActivityModel();
				bareActivityModel.type = ElevateSport.VirtualRide;
				const activityStreamsModel: ActivityStreamsModel = new ActivityStreamsModel();
				activityStreamsModel.grade_smooth = [];
				const estimateCyclingPowerStreamSpy = spyOn(fileSystemConnector, "estimateCyclingPowerStream").and.callThrough();

				// When
				fileSystemConnector.computeAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

				// Then
				expect(estimateCyclingPowerStreamSpy).not.toHaveBeenCalled();
				done();
			});
		});
	});
});
