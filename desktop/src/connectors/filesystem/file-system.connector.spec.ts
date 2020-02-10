import { ActivityFile, ActivityFileType, FileSystemConnector } from "./file-system.connector";
import {
	ActivityStreamsModel,
	AthleteModel,
	AthleteSettingsModel,
	BareActivityModel,
	ConnectorSyncDateTime,
	EnvTarget,
	SyncedActivityModel,
	UserSettings
} from "@elevate/shared/models";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as xmldom from "xmldom";
import {
	ActivitySyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	StartedSyncEvent,
	StoppedSyncEvent,
	SyncEvent,
	SyncEventType
} from "@elevate/shared/sync";
import { filter } from "rxjs/operators";
import { Subject } from "rxjs";
import { SportsLib } from "sports-lib";
import { ElevateSport } from "@elevate/shared/enums";
import { BaseConnector } from "../base.connector";
import { Activity } from "sports-lib/lib/activities/activity";
import { Creator } from "sports-lib/lib/creators/creator";
import { ActivityTypes } from "sports-lib/lib/activities/activity.types";
import { DataHeartRate } from "sports-lib/lib/data/data.heart-rate";
import { DataCadence } from "sports-lib/lib/data/data.cadence";
import { DataPower } from "sports-lib/lib/data/data.power";

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
	const connectorSyncDateTime = null;

	let fileSystemConnector: FileSystemConnector;
	let syncFilesSpy: jasmine.Spy;

	beforeEach((done: Function) => {
		fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
			connectorSyncDateTime, activitiesLocalPath_01);
		syncFilesSpy = spyOn(fileSystemConnector, "syncFiles").and.callThrough();
		done();
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

			const getLastModificationDateSpy = spyOn(fileSystemConnector, "getLastModificationDate").and.callFake(absolutePath => {
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

			expect(getLastModificationDateSpy).toHaveBeenCalledTimes(3);
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

				/*			else {// TODO !?
								expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
								expect((<ActivitySyncEvent> syncEvent).activity).toBeDefined();
							}*/

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


		// TODO it("should not stop sync and notify errors when multiple errors are provided by syncPages()", (done: Function) => {

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
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDateTime), activitiesLocalPath_02);
			fileSystemConnector.scanSubDirectories = scanSubDirectories;

			const scanForActivitiesSpy = spyOn(fileSystemConnector, "scanForActivities").and.callThrough();
			const importFromGPXSpy = spyOn(SportsLib, "importFromGPX").and.callThrough();
			const importFromTCXSpy = spyOn(SportsLib, "importFromTCX").and.callThrough();
			const importFromFITSpy = spyOn(SportsLib, "importFromFit").and.callThrough();
			const findSyncedActivityModelsSpy = spyOn(fileSystemConnector, "findSyncedActivityModels")
				.and.returnValue(Promise.resolve(null));
			const extractActivityStreamsSpy = spyOn(fileSystemConnector, "extractActivityStreams").and.callThrough();
			const appendAdditionalStreamsSpy = spyOn(fileSystemConnector, "appendAdditionalStreams").and.callThrough();
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

				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDateTime, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(findSyncedActivityModelsSpy).toHaveBeenNthCalledWith(1, "2019-08-11T12:52:20.000Z", 7263.962);

				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(15);
				expect(appendAdditionalStreamsSpy).toHaveBeenCalledTimes(15);

				const activitySyncEvent: ActivitySyncEvent = syncEventNextSpy.calls.argsFor(1)[0]; // => fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx
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
				expect(activitySyncEvent.activity.moving_time_raw).toEqual(9958);
				expect(activitySyncEvent.activity.elevation_gain_raw).toEqual(671);
				expect(activitySyncEvent.activity.sourceConnectorType).toEqual(ConnectorType.FILE_SYSTEM);
				expect(activitySyncEvent.activity.extras[FileSystemConnector.EXTRA_ACTIVITY_LOCATION].onMachineId).toBeDefined();
				expect(activitySyncEvent.activity.extras[FileSystemConnector.EXTRA_ACTIVITY_LOCATION].path).toContain(expectedActivityFilePathMatch);
				expect(activitySyncEvent.activity.athleteSnapshot).toEqual(fileSystemConnector.athleteSnapshotResolver.getCurrent());
				expect(activitySyncEvent.activity.extendedStats).not.toBeNull();

				expect(activitySyncEvent.compressedStream).not.toBeNull();

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should sync fully activities of an input folder already synced (no recent activities => syncDate = null)", (done: Function) => {

			// Given
			const syncDate = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDate), activitiesLocalPath_02);
			fileSystemConnector.scanSubDirectories = scanSubDirectories;

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
			const appendAdditionalStreamsSpy = spyOn(fileSystemConnector, "appendAdditionalStreams").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDate, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);
				expect(appendAdditionalStreamsSpy).toHaveBeenCalledTimes(0);

				expect(syncEventNextSpy).toHaveBeenCalledTimes(15);
				expect(syncEventNextSpy).toHaveBeenCalledWith(expectedActivitySyncEvent);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should send sync error when multiple activities are found", (done: Function) => {

			// Given
			const syncDate = null; // Force sync on all scanned files
			const syncEvents = new Subject<SyncEvent>();
			const scanSubDirectories = true;
			fileSystemConnector = FileSystemConnector.create(AthleteModel.DEFAULT_MODEL, defaultsByEnvTarget,
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, syncDate), activitiesLocalPath_02);
			fileSystemConnector.scanSubDirectories = scanSubDirectories;

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
			const appendAdditionalStreamsSpy = spyOn(fileSystemConnector, "appendAdditionalStreams").and.callThrough();
			const syncEventNextSpy = spyOn(syncEvents, "next").and.stub();
			const expectedActivitiesFound = expectedExistingSyncedActivity.name + " (" + new Date(expectedExistingSyncedActivity.start_time).toString() + ")";

			// When
			const promise = fileSystemConnector.syncFiles(syncEvents);

			// Then
			promise.then(() => {
				expect(scanForActivitiesSpy).toHaveBeenCalledWith(activitiesLocalPath_02, syncDate, scanSubDirectories);
				expect(importFromGPXSpy).toHaveBeenCalledTimes(6);
				expect(importFromTCXSpy).toHaveBeenCalledTimes(6);
				expect(importFromFITSpy).toHaveBeenCalledTimes(3);

				expect(findSyncedActivityModelsSpy).toHaveBeenCalledTimes(15);
				expect(createBareActivitySpy).toHaveBeenCalledTimes(0);
				expect(extractActivityStreamsSpy).toHaveBeenCalledTimes(0);
				expect(appendAdditionalStreamsSpy).toHaveBeenCalledTimes(0);

				expect(syncEventNextSpy).toHaveBeenCalledTimes(15);

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
				expect(bareActivity.elapsed_time_raw).toEqual(10514);
				expect(bareActivity.hasPowerMeter).toEqual(false);
				expect(bareActivity.trainer).toEqual(false);
				expect(bareActivity.commute).toEqual(null);
				expect(Math.floor(bareActivity.distance_raw)).toEqual(59853);

				done();
			});
		});

		it("should convert known 'sports-lib' type to ElevateSport", (done: Function) => {
			// Given
			const sportsLibType = "Cycling";
			const expectedElevateSport = ElevateSport.Ride;

			// When
			const elevateSport: ElevateSport = fileSystemConnector.convertToElevateSport(sportsLibType);

			// Then
			expect(elevateSport).toEqual(expectedElevateSport);

			done();
		});

		it("should convert unknown 'sports-lib' type to ElevateSport other type", (done: Function) => {
			// Given
			const sportsLibType = "FakeSport";
			const expectedElevateSport = ElevateSport.Other;

			// When
			const elevateSport: ElevateSport = fileSystemConnector.convertToElevateSport(sportsLibType);

			// Then
			expect(elevateSport).toEqual(expectedElevateSport);

			done();
		});

	});

	describe("Activity streams", () => {

		describe("Grade streams calculation", () => {

			it("should add estimated grade stream to activity having distance and altitude stream data", (done: Function) => {

				// Given
				const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
				const expectedSamplesLength = 3179;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					return Promise.resolve(fileSystemConnector.extractActivityStreams(event.getFirstActivity()));
				});

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {
					const gradeStream = fileSystemConnector.calculateGradeStream(activityStreamsModel.distance, activityStreamsModel.altitude);

					// Then
					expect(gradeStream.length).toEqual(expectedSamplesLength);
					done();
				});

			});

			it("should throw error when calculating estimated grade stream without distance or altitude stream data", (done: Function) => {

				// Given, When
				const noAltitudeCall = () => fileSystemConnector.calculateGradeStream([1, 2, 3, 5], []);
				const noDistanceCall = () => fileSystemConnector.calculateGradeStream([], [1, 2, 3, 5]);

				// Then
				expect(noAltitudeCall).toThrowError();
				expect(noDistanceCall).toThrowError();

				done();
			});

		});

		describe("Grade adjusted speed stream calculation", () => {

			it("should calculate grade adjusted speed", (done: Function) => {

				// Given
				const filePath = __dirname + "/fixtures/activities-02/runs/strava_export/20160911_run_708752345.tcx";
				const expectedSamplesLength = 1495;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					return Promise.resolve(fileSystemConnector.extractActivityStreams(event.getFirstActivity()));
				}).then((activityStreamsModel: ActivityStreamsModel) => {
					activityStreamsModel.grade_smooth = fileSystemConnector.calculateGradeStream(activityStreamsModel.distance, activityStreamsModel.altitude);
					return Promise.resolve(activityStreamsModel);
				});

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const gradeAdjustedSpeed = fileSystemConnector.calculateGradeAdjustedSpeed(ElevateSport.Run, activityStreamsModel.velocity_smooth, activityStreamsModel.grade_smooth);

					// Then
					expect(gradeAdjustedSpeed.length).toEqual(expectedSamplesLength);
					done();
				});

			});

			it("should throw error when sport type is different of Run & VirtualRun", (done: Function) => {

				// Given, When
				const rideCall = () => fileSystemConnector.calculateGradeAdjustedSpeed(ElevateSport.Ride, [1, 2, 3, 5], [1, 2, 3, 5]);
				const alpineSkiCall = () => fileSystemConnector.calculateGradeAdjustedSpeed(ElevateSport.AlpineSki, [1, 2, 3, 5], [1, 2, 3, 5]);

				// Then
				expect(rideCall).toThrowError();
				expect(alpineSkiCall).toThrowError();

				done();
			});

			it("should throw error when no velocity or grade stream", (done: Function) => {

				// Given, When
				const noVelocityCall = () => fileSystemConnector.calculateGradeAdjustedSpeed(ElevateSport.Run, [], [1, 2, 3, 5]);
				const noGradeCall = () => fileSystemConnector.calculateGradeAdjustedSpeed(ElevateSport.VirtualRun, [1, 2, 3, 5], []);

				// Then
				expect(noVelocityCall).toThrowError();
				expect(noGradeCall).toThrowError();

				done();

			});


		});

		describe("Estimated power streams calculation", () => {

			it("should add estimated power data stream to a cycling activities having speed and grade stream data & performed without power meter", (done: Function) => {

				// Given
				const riderWeight = 75;
				const filePath = __dirname + "/fixtures/activities-02/rides/garmin_export/20190815_ride_3953195468.tcx";
				const expectedSamplesLength = 3179;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					return Promise.resolve(fileSystemConnector.extractActivityStreams(event.getFirstActivity()));
				}).then((activityStreamsModel: ActivityStreamsModel) => {
					activityStreamsModel.grade_smooth = fileSystemConnector.calculateGradeStream(activityStreamsModel.distance, activityStreamsModel.altitude);
					return Promise.resolve(activityStreamsModel);
				});

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const powerEstimatedStream = fileSystemConnector.estimateCyclingPowerStream(ElevateSport.Ride, activityStreamsModel.velocity_smooth, activityStreamsModel.grade_smooth, riderWeight);

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

				spyOn(sportsLibActivity, "getStream").and.returnValue({
					getDurationOfData: () => [-1]
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
					expect(activityStreamsModel.velocity_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.heartrate.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.altitude.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.cadence.length).toEqual(expectedSamplesLength);
					expect(activityStreamsModel.watts).toEqual([]);

					done();
				});
			});
		});

		describe("Calculate additional streams", () => {

			it("should calculate grade & estimated power streams on cycling activity without power meter", (done: Function) => {

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

				const calculateGradeStreamSpy = spyOn(fileSystemConnector, "calculateGradeStream").and.callThrough();
				const estimateCyclingPowerStreamSpy = spyOn(fileSystemConnector, "estimateCyclingPowerStream").and.callThrough();
				const calculateGradeAdjustedSpeedSpy = spyOn(fileSystemConnector, "calculateGradeAdjustedSpeed").and.callThrough();

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const activityStreamsFullModel: ActivityStreamsModel = fileSystemConnector.appendAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

					// Then
					expect(activityStreamsFullModel.grade_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsFullModel.watts.length).toEqual(expectedSamplesLength);
					expect(activityStreamsFullModel.watts_calc).toBeUndefined();
					expect(calculateGradeStreamSpy).toHaveBeenCalledTimes(1);
					expect(estimateCyclingPowerStreamSpy).toHaveBeenCalledTimes(1);
					expect(calculateGradeAdjustedSpeedSpy).not.toHaveBeenCalled();
					done();
				});
			});

			it("should calculate grade & grade adjusted speed streams on running activity", (done: Function) => {

				// Given
				let bareActivityModel: BareActivityModel;
				const filePath = __dirname + "/fixtures/activities-02/runs/strava_export/20160911_run_708752345.tcx";
				const expectedSamplesLength = 1495;
				const promise = SportsLib.importFromTCX(new xmldom.DOMParser().parseFromString(fs.readFileSync(filePath).toString(), "application/xml")).then(event => {
					const sportsLibActivity = event.getFirstActivity();
					bareActivityModel = fileSystemConnector.createBareActivity(sportsLibActivity);
					return Promise.resolve(fileSystemConnector.extractActivityStreams(sportsLibActivity));
				});
				const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;

				const calculateGradeStreamSpy = spyOn(fileSystemConnector, "calculateGradeStream").and.callThrough();
				const estimateCyclingPowerStreamSpy = spyOn(fileSystemConnector, "estimateCyclingPowerStream").and.callThrough();
				const calculateGradeAdjustedSpeedSpy = spyOn(fileSystemConnector, "calculateGradeAdjustedSpeed").and.callThrough();

				// When
				promise.then((activityStreamsModel: ActivityStreamsModel) => {

					const activityStreamsFullModel: ActivityStreamsModel = fileSystemConnector.appendAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

					// Then
					expect(activityStreamsFullModel.grade_smooth.length).toEqual(expectedSamplesLength);
					expect(activityStreamsFullModel.grade_adjusted_speed.length).toEqual(expectedSamplesLength);
					expect(calculateGradeStreamSpy).toHaveBeenCalledTimes(1);
					expect(calculateGradeAdjustedSpeedSpy).toHaveBeenCalledTimes(1);
					expect(estimateCyclingPowerStreamSpy).not.toHaveBeenCalled();
					done();
				});
			});

			it("should not calculate estimated power streams on cycling activity without distance or altitude", (done: Function) => {

				// Given
				const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
				const bareActivityModel: BareActivityModel = new BareActivityModel();
				bareActivityModel.type = ElevateSport.VirtualRide;
				const activityStreamsModel: ActivityStreamsModel = new ActivityStreamsModel();
				activityStreamsModel.distance = [];
				activityStreamsModel.altitude = [];
				const calculateGradeStreamSpy = spyOn(fileSystemConnector, "calculateGradeStream").and.callThrough();
				const estimateCyclingPowerStreamSpy = spyOn(fileSystemConnector, "estimateCyclingPowerStream").and.callThrough();

				// When
				fileSystemConnector.appendAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

				// Then
				expect(calculateGradeStreamSpy).not.toHaveBeenCalled();
				expect(estimateCyclingPowerStreamSpy).not.toHaveBeenCalled();
				done();
			});

			it("should not calculate grade adjusted speed streams on running activity without distance or altitude", (done: Function) => {

				// Given
				const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
				const bareActivityModel: BareActivityModel = new BareActivityModel();
				bareActivityModel.type = ElevateSport.VirtualRun;
				const activityStreamsModel: ActivityStreamsModel = new ActivityStreamsModel();
				activityStreamsModel.distance = [];
				activityStreamsModel.altitude = [];
				const calculateGradeStreamSpy = spyOn(fileSystemConnector, "calculateGradeStream").and.callThrough();
				const calculateGradeAdjustedSpeedSpy = spyOn(fileSystemConnector, "calculateGradeAdjustedSpeed").and.callThrough();

				// When
				fileSystemConnector.appendAdditionalStreams(bareActivityModel, activityStreamsModel, athleteSettingsModel);

				// Then
				expect(calculateGradeStreamSpy).not.toHaveBeenCalled();
				expect(calculateGradeAdjustedSpeedSpy).not.toHaveBeenCalled();
				done();
			});

		});
	});
});
