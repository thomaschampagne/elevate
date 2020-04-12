import { BaseConnector, PrimitiveSourceData } from "../base.connector";
import {
    ActivityComputer,
    ActivitySyncEvent,
    ConnectorType,
    ErrorSyncEvent,
    GenericSyncEvent,
    StartedSyncEvent,
    StoppedSyncEvent,
    SyncEvent,
    SyncEventType
} from "@elevate/shared/sync";
import { ReplaySubject, Subject } from "rxjs";
import { ActivityStreamsModel, AthleteModel, AthleteSettingsModel, BareActivityModel, ConnectorSyncDateTime, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { Service } from "../../service";
import * as xmldom from "xmldom";
import { ElevateSport } from "@elevate/shared/enums";
import logger from "electron-log";
import { Partial } from "rollup-plugin-typescript2/dist/partial";
import { ActivityTypeGroups, ActivityTypes, ActivityTypesHelper } from "@sports-alliance/sports-lib/lib/activities/activity.types";
import { SportsLib } from "@sports-alliance/sports-lib";
import { DataSpeed } from "@sports-alliance/sports-lib/lib/data/data.speed";
import { ActivityInterface } from "@sports-alliance/sports-lib/lib/activities/activity.interface";
import { DataLatitudeDegrees } from "@sports-alliance/sports-lib/lib/data/data.latitude-degrees";
import { DataAscent } from "@sports-alliance/sports-lib/lib/data/data.ascent";
import { DataAltitude } from "@sports-alliance/sports-lib/lib/data/data.altitude";
import { DataDistance } from "@sports-alliance/sports-lib/lib/data/data.distance";
import { EventInterface } from "@sports-alliance/sports-lib/lib/events/event.interface";
import { DataSpeedAvg } from "@sports-alliance/sports-lib/lib/data/data.speed-avg";
import { DataHeartRate } from "@sports-alliance/sports-lib/lib/data/data.heart-rate";
import { DataGradeAdjustedSpeed } from "@sports-alliance/sports-lib/lib/data/data.grade-adjusted-speed";
import { DataPower } from "@sports-alliance/sports-lib/lib/data/data.power";
import { DataDuration } from "@sports-alliance/sports-lib/lib/data/data.duration";
import { DataSpeedMax } from "@sports-alliance/sports-lib/lib/data/data.speed-max";
import { DataCadence } from "@sports-alliance/sports-lib/lib/data/data.cadence";
import { DataLongitudeDegrees } from "@sports-alliance/sports-lib/lib/data/data.longitude-degrees";
import { DataGrade } from "@sports-alliance/sports-lib/lib/data/data.grade";
import { EventLibError } from "@sports-alliance/sports-lib/lib/errors/event-lib.error";
import UserSettingsModel = UserSettings.UserSettingsModel;

export enum ActivityFileType {
    GPX = "gpx",
    TCX = "tcx",
    FIT = "fit"
}

/**
 * Model associated to FileSystem synced activities
 */
export class ActivityFile {

    public type: ActivityFileType;
    public location: { onMachineId: string, path: string };
    public lastModificationDate: string;

    constructor(type: ActivityFileType, absolutePath: string, machineId: string, lastModificationDate: Date, hash: string) {
        this.type = type;
        this.location = {onMachineId: machineId, path: absolutePath};
        this.lastModificationDate = _.isDate(lastModificationDate) ? lastModificationDate.toISOString() : null;
    }
}

export class FileSystemConnector extends BaseConnector {

    private static HumanizedDayMoment = class {

        private static readonly SPLIT_AFTERNOON_AT = 12;
        private static readonly SPLIT_EVENING_AT = 17;
        private static readonly MORNING = "Morning";
        private static readonly AFTERNOON = "Afternoon";
        private static readonly EVENING = "Evening";

        public static resolve(date: Date): string {
            const currentHour = date.getHours();
            if (currentHour >= FileSystemConnector.HumanizedDayMoment.SPLIT_AFTERNOON_AT
                && currentHour <= FileSystemConnector.HumanizedDayMoment.SPLIT_EVENING_AT) { // Between 12 PM and 5PM
                return FileSystemConnector.HumanizedDayMoment.AFTERNOON;
            } else if (currentHour >= FileSystemConnector.HumanizedDayMoment.SPLIT_EVENING_AT) {
                return FileSystemConnector.HumanizedDayMoment.EVENING;
            }
            return FileSystemConnector.HumanizedDayMoment.MORNING;
        }
    };
    private static readonly ENABLED: boolean = true;
    private static readonly SPORTS_LIB_TYPES_MAP: { from: string, to: ElevateSport }[] = [
        {from: ActivityTypes.Aerobics, to: ElevateSport.Cardio},
        {from: ActivityTypes.AlpineSkiing, to: ElevateSport.AlpineSki},
        {from: ActivityTypes.AmericanFootball, to: ElevateSport.AmericanFootball},
        {from: ActivityTypes.Aquathlon, to: ElevateSport.Aquathlon},
        {from: ActivityTypes.BackcountrySkiing, to: ElevateSport.BackcountrySki},
        {from: ActivityTypes.Badminton, to: ElevateSport.Badminton},
        {from: ActivityTypes.Baseball, to: ElevateSport.Baseball},
        {from: ActivityTypes.Basketball, to: ElevateSport.Basketball},
        {from: ActivityTypes.Boxing, to: ElevateSport.Boxe},
        {from: ActivityTypes.Canoeing, to: ElevateSport.Canoeing},
        {from: ActivityTypes.CardioTraining, to: ElevateSport.Cardio},
        {from: ActivityTypes.Climbing, to: ElevateSport.Climbing},
        {from: ActivityTypes.Combat, to: ElevateSport.Combat},
        {from: ActivityTypes.Cricket, to: ElevateSport.Cricket},
        {from: ActivityTypes.Crossfit, to: ElevateSport.Crossfit},
        {from: ActivityTypes.CrosscountrySkiing, to: ElevateSport.NordicSki},
        {from: ActivityTypes.Crosstrainer, to: ElevateSport.Elliptical},
        {from: ActivityTypes.Cycling, to: ElevateSport.Ride},
        {from: ActivityTypes.Dancing, to: ElevateSport.Dance},
        {from: ActivityTypes.Diving, to: ElevateSport.Diving},
        {from: ActivityTypes.DownhillSkiing, to: ElevateSport.AlpineSki},
        {from: ActivityTypes.Driving, to: ElevateSport.Drive},
        {from: ActivityTypes.Duathlon, to: ElevateSport.Duathlon},
        {from: ActivityTypes.EBikeRide, to: ElevateSport.EBikeRide},
        {from: ActivityTypes.EllipticalTrainer, to: ElevateSport.Elliptical},
        {from: ActivityTypes.Fishing, to: ElevateSport.Fishing},
        {from: ActivityTypes.FitnessEquipment, to: ElevateSport.Workout},
        {from: ActivityTypes.FlexibilityTraining, to: ElevateSport.Workout},
        {from: ActivityTypes.FloorClimbing, to: ElevateSport.Workout},
        {from: ActivityTypes.Floorball, to: ElevateSport.Workout},
        {from: ActivityTypes.Flying, to: ElevateSport.Flying},
        {from: ActivityTypes.Football, to: ElevateSport.Football},
        {from: ActivityTypes.FreeDiving, to: ElevateSport.Diving},
        {from: ActivityTypes.Frisbee, to: ElevateSport.Frisbee},
        {from: ActivityTypes.Generic, to: ElevateSport.Workout},
        {from: ActivityTypes.Golf, to: ElevateSport.Golf},
        {from: ActivityTypes.Gymnastics, to: ElevateSport.Gymnastics},
        {from: ActivityTypes.Handcycle, to: ElevateSport.Handcycle},
        {from: ActivityTypes.Handball, to: ElevateSport.Handball},
        {from: ActivityTypes.HangGliding, to: ElevateSport.HangGliding},
        {from: ActivityTypes.Hiking, to: ElevateSport.Hike},
        {from: ActivityTypes.HorsebackRiding, to: ElevateSport.HorsebackRiding},
        {from: ActivityTypes.IceHockey, to: ElevateSport.IceHockey},
        {from: ActivityTypes.IceSkating, to: ElevateSport.IceSkate},
        {from: ActivityTypes.IndoorCycling, to: ElevateSport.Ride},
        {from: ActivityTypes.IndoorRowing, to: ElevateSport.Rowing},
        {from: ActivityTypes.IndoorRunning, to: ElevateSport.Run},
        {from: ActivityTypes.IndoorTraining, to: ElevateSport.Workout},
        {from: ActivityTypes.InlineSkating, to: ElevateSport.InlineSkate},
        {from: ActivityTypes.Kayaking, to: ElevateSport.Kayaking},
        {from: ActivityTypes.Kettlebell, to: ElevateSport.WeightTraining},
        {from: ActivityTypes.Kitesurfing, to: ElevateSport.Kitesurf},
        {from: ActivityTypes.Motorcycling, to: ElevateSport.MotorSports},
        {from: ActivityTypes.Motorsports, to: ElevateSport.MotorSports},
        {from: ActivityTypes.MountainBiking, to: ElevateSport.Ride},
        {from: ActivityTypes.Mountaineering, to: ElevateSport.Mountaineering},
        {from: ActivityTypes.NordicWalking, to: ElevateSport.Walk},
        {from: ActivityTypes.OpenWaterSwimming, to: ElevateSport.Swim},
        {from: ActivityTypes.Orienteering, to: ElevateSport.Orienteering},
        {from: ActivityTypes.Paddling, to: ElevateSport.Canoeing},
        {from: ActivityTypes.Paragliding, to: ElevateSport.Paragliding},
        {from: ActivityTypes.Rafting, to: ElevateSport.Canoeing},
        {from: ActivityTypes.RockClimbing, to: ElevateSport.RockClimbing},
        {from: ActivityTypes.RollerSki, to: ElevateSport.RollerSki},
        {from: ActivityTypes.Rowing, to: ElevateSport.Rowing},
        {from: ActivityTypes.Rugby, to: ElevateSport.Rugby},
        {from: ActivityTypes.Running, to: ElevateSport.Run},
        {from: ActivityTypes.Sailing, to: ElevateSport.Sailing},
        {from: ActivityTypes.ScubaDiving, to: ElevateSport.Diving},
        {from: ActivityTypes.Skating, to: ElevateSport.Skating},
        {from: ActivityTypes.SkiTouring, to: ElevateSport.SkiTouring},
        {from: ActivityTypes.SkyDiving, to: ElevateSport.SkyDiving},
        {from: ActivityTypes.Snorkeling, to: ElevateSport.Snorkeling},
        {from: ActivityTypes.Snowboarding, to: ElevateSport.Snowboard},
        {from: ActivityTypes.Snowmobiling, to: ElevateSport.Snowmobiling},
        {from: ActivityTypes.Snowshoeing, to: ElevateSport.Snowshoe},
        {from: ActivityTypes.Soccer, to: ElevateSport.Football},
        {from: ActivityTypes.Softball, to: ElevateSport.Softball},
        {from: ActivityTypes.Squash, to: ElevateSport.Squash},
        {from: ActivityTypes.StairStepper, to: ElevateSport.StairStepper},
        {from: ActivityTypes.StandUpPaddling, to: ElevateSport.StandUpPaddling},
        {from: ActivityTypes.StrengthTraining, to: ElevateSport.WeightTraining},
        {from: ActivityTypes.Stretching, to: ElevateSport.Stretching},
        {from: ActivityTypes.Surfing, to: ElevateSport.Surfing},
        {from: ActivityTypes.Swimming, to: ElevateSport.Swim},
        {from: ActivityTypes.Swimrun, to: ElevateSport.Workout},
        {from: ActivityTypes.TableTennis, to: ElevateSport.TableTennis},
        {from: ActivityTypes.Tactical, to: ElevateSport.Tactical},
        {from: ActivityTypes.TelemarkSkiing, to: ElevateSport.TelemarkSki},
        {from: ActivityTypes.Tennis, to: ElevateSport.Tennis},
        {from: ActivityTypes.TrackAndField, to: ElevateSport.TrackAndField},
        {from: ActivityTypes.TrailRunning, to: ElevateSport.Run},
        {from: ActivityTypes.Training, to: ElevateSport.Workout},
        {from: ActivityTypes.Treadmill, to: ElevateSport.Run},
        {from: ActivityTypes.Trekking, to: ElevateSport.Hike},
        {from: ActivityTypes.Triathlon, to: ElevateSport.Triathlon},
        {from: ActivityTypes.Velomobile, to: ElevateSport.Velomobile},
        {from: ActivityTypes.VirtualCycling, to: ElevateSport.VirtualRide},
        {from: ActivityTypes.VirtualRunning, to: ElevateSport.VirtualRun},
        {from: ActivityTypes.Volleyball, to: ElevateSport.Volleyball},
        {from: ActivityTypes.Wakeboarding, to: ElevateSport.Wakeboarding},
        {from: ActivityTypes.Walking, to: ElevateSport.Walk},
        {from: ActivityTypes.WaterSkiing, to: ElevateSport.WaterSkiing},
        {from: ActivityTypes.WeightTraining, to: ElevateSport.WeightTraining},
        {from: ActivityTypes.Wheelchair, to: ElevateSport.Wheelchair},
        {from: ActivityTypes.Windsurfing, to: ElevateSport.Windsurf},
        {from: ActivityTypes.Workout, to: ElevateSport.Workout},
        {from: ActivityTypes.Yoga, to: ElevateSport.Yoga},
        {from: ActivityTypes.YogaPilates, to: ElevateSport.Yoga},
    ];
    private static unPackerInstance: { unpack: (path: string, options: any, callback: (err: any) => void) => void };
    public inputDirectory: string;
    public scanSubDirectories: boolean;
    public deleteActivityFilesAfterSync: boolean;
    public extractArchiveFiles: boolean;
    public deleteArchivesAfterExtract: boolean;
    public detectSportTypeWhenUnknown: boolean;
    public athleteMachineId: string;

    constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel,
                connectorSyncDateTime: ConnectorSyncDateTime, inputDirectory: string, scanSubDirectories: boolean,
                deleteActivityFilesAfterSync: boolean, extractArchiveFiles: boolean, deleteArchivesAfterExtract: boolean, detectSportTypeWhenUnknown: boolean) {
        super(ConnectorType.FILE_SYSTEM, athleteModel, userSettingsModel, connectorSyncDateTime, priority, FileSystemConnector.ENABLED);
        this.inputDirectory = inputDirectory;
        this.scanSubDirectories = scanSubDirectories;
        this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
        this.extractArchiveFiles = extractArchiveFiles;
        this.deleteArchivesAfterExtract = deleteArchivesAfterExtract;
        this.detectSportTypeWhenUnknown = detectSportTypeWhenUnknown;
        this.athleteMachineId = Service.instance().getRuntimeInfo().athleteMachineId;
    }

    public static getAllUnPacker(): { unpack: (path: string, options: any, callback: (err: any) => void) => void } {
        if (!this.unPackerInstance) {
            this.unPackerInstance = require("all-unpacker");
        }
        return this.unPackerInstance;
    }

    public static create(athleteModel: AthleteModel, userSettingsModel: UserSettings.UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime, inputDirectory: string,
                         scanSubDirectories: boolean = false, deleteActivityFilesAfterSync: boolean = false, extractArchiveFiles: boolean = false,
                         deleteArchivesAfterExtract: boolean = false, detectSportTypeWhenUnknown: boolean = false) {
        return new FileSystemConnector(null, athleteModel, userSettingsModel, connectorSyncDateTime, inputDirectory, scanSubDirectories, deleteActivityFilesAfterSync,
            extractArchiveFiles, deleteArchivesAfterExtract, detectSportTypeWhenUnknown);
    }

    public sync(): Subject<SyncEvent> {

        if (this.isSyncing) {

            this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.FILE_SYSTEM));

        } else {

            // Start a new sync
            this.syncEvents$ = new ReplaySubject<SyncEvent>();
            this.syncEvents$.next(new StartedSyncEvent(ConnectorType.FILE_SYSTEM));
            this.isSyncing = true;

            this.syncFiles(this.syncEvents$).then(() => {
                this.isSyncing = false;
                this.syncEvents$.complete();
            }, (syncEvent: SyncEvent) => {

                this.isSyncing = false;
                const isCancelEvent = syncEvent.type === SyncEventType.STOPPED;

                if (isCancelEvent) {
                    this.syncEvents$.next(syncEvent);
                } else {
                    logger.error(syncEvent);
                    this.syncEvents$.error(syncEvent);
                }
            });
        }

        return this.syncEvents$;
    }

    public syncFiles(syncEvents$: Subject<SyncEvent>): Promise<void> {

        if (!fs.existsSync(this.inputDirectory)) {
            return Promise.reject(ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.create(this.inputDirectory));
        }

        const afterDate = this.syncDateTime ? new Date(this.syncDateTime * 1000) : null;

        let prepareScanDirectory: Promise<void> = Promise.resolve();

        if (!afterDate && this.extractArchiveFiles) {
            const deflateNotifier = new Subject<string>();
            deflateNotifier.subscribe(extractedArchivePath => {
                const extractedArchiveFileName = path.basename(extractedArchivePath);
                const evtDesc = `Activities in "${extractedArchiveFileName}" file have been extracted.`;
                syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE_SYSTEM, evtDesc));
                logger.info(evtDesc);
            });
            prepareScanDirectory = this.scanDeflateActivitiesFromArchives(this.inputDirectory, this.deleteArchivesAfterExtract, deflateNotifier, this.scanSubDirectories);
        }

        return prepareScanDirectory.then(() => {
            syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE_SYSTEM, "Scanning for activities..."));
            const activityFiles: ActivityFile[] = this.scanForActivities(this.inputDirectory, afterDate, this.scanSubDirectories);
            return Promise.resolve(activityFiles);

        }).then(activityFiles => {

            logger.info("Parsing " + activityFiles.length + " activity files.");

            return activityFiles.reduce((previousPromise: Promise<void>, activityFile: ActivityFile) => {

                return previousPromise.then(() => {

                    if (this.stopRequested) {
                        return Promise.reject(new StoppedSyncEvent(ConnectorType.FILE_SYSTEM));
                    }

                    const activityFileBuffer = fs.readFileSync(activityFile.location.path);

                    let parseSportsLibActivity: Promise<EventInterface> = null;

                    logger.info("Parsing activity file: " + activityFile.location.path);

                    switch (activityFile.type) {
                        case ActivityFileType.GPX:
                            parseSportsLibActivity = SportsLib.importFromGPX(activityFileBuffer.toString(), xmldom.DOMParser);
                            break;

                        case ActivityFileType.TCX:
                            const doc = (new xmldom.DOMParser()).parseFromString(activityFileBuffer.toString(), "application/xml");
                            parseSportsLibActivity = SportsLib.importFromTCX(doc);
                            break;

                        case ActivityFileType.FIT:
                            parseSportsLibActivity = SportsLib.importFromFit(activityFileBuffer);
                            break;

                        default:
                            const errorMessage = `Type ${activityFile.type} not supported. Failed to parse ${activityFile.location.path}`;
                            logger.error(errorMessage);
                            return Promise.reject(errorMessage);
                    }

                    return parseSportsLibActivity.then((event: EventInterface) => {

                        // Loop on all activities
                        return event.getActivities().reduce((previousActivityProcessed: Promise<void>, sportsLibActivity: ActivityInterface) => {

                            return previousActivityProcessed.then(() => {

                                // Is an transition activity (e.g. from swim to cycling for triathlon), then skip it
                                if (sportsLibActivity && sportsLibActivity.type === ActivityTypes.Transition) {
                                    return Promise.resolve();
                                }

                                return this.findSyncedActivityModels(sportsLibActivity.startDate.toISOString(), sportsLibActivity.getDuration().getValue())
                                    .then((syncedActivityModels: SyncedActivityModel[]) => {
                                        if (_.isEmpty(syncedActivityModels)) {

                                            try {
                                                // Create bare activity from "sports-lib" activity
                                                const bareActivity = this.createBareActivity(sportsLibActivity);

                                                let syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
                                                syncedActivityModel.start_timestamp = new Date(bareActivity.start_time).getTime() / 1000;

                                                // Assign reference to strava activity
                                                syncedActivityModel.extras = {fs_activity_location: activityFile.location}; // Keep tracking  of activity id
                                                syncedActivityModel.id = BaseConnector.hashData(syncedActivityModel.start_time, 6)
                                                    + "-" + BaseConnector.hashData(syncedActivityModel.end_time, 6);

                                                // Resolve athlete snapshot for current activity date
                                                syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(syncedActivityModel.start_time);

                                                // Prepare streams
                                                const activityStreamsModel = this.computeAdditionalStreams(bareActivity,
                                                    this.extractActivityStreams(sportsLibActivity), syncedActivityModel.athleteSnapshot.athleteSettings);

                                                // Compute activity
                                                syncedActivityModel.extendedStats = this.computeExtendedStats(syncedActivityModel,
                                                    syncedActivityModel.athleteSnapshot, this.userSettingsModel, activityStreamsModel);

                                                // Try to use primitive data from computation. Else use primitive data from source (activity files) if exists
                                                const primitiveSourceData = this.extractPrimitiveSourceData(sportsLibActivity);
                                                syncedActivityModel = BaseConnector.updatePrimitiveStatsFromComputation(<SyncedActivityModel> syncedActivityModel,
                                                    activityStreamsModel, primitiveSourceData);

                                                // Track connector type
                                                syncedActivityModel.sourceConnectorType = ConnectorType.FILE_SYSTEM;

                                                // Check if user missed some athlete settings. Goal: avoid missing stress scores because of missing settings.
                                                syncedActivityModel.settingsLack = ActivityComputer.hasAthleteSettingsLacks(syncedActivityModel.distance_raw,
                                                    syncedActivityModel.moving_time_raw, syncedActivityModel.elapsed_time_raw, syncedActivityModel.type,
                                                    syncedActivityModel.extendedStats, syncedActivityModel.athleteSnapshot.athleteSettings, activityStreamsModel);

                                                // Gunzip stream as base64
                                                const compressedStream = (activityStreamsModel) ? ActivityStreamsModel.inflate(activityStreamsModel) : null;

                                                // Notify the new SyncedActivityModel
                                                syncEvents$.next(new ActivitySyncEvent(ConnectorType.FILE_SYSTEM,
                                                    null, <SyncedActivityModel> syncedActivityModel, true, compressedStream));

                                            } catch (error) {
                                                logger.error(error);
                                                const errorMessage = "Unable to compute activity started '"
                                                    + sportsLibActivity.startDate.toISOString() + "' cause: " + ((error.message) ? error.message : error.toString());

                                                const activityInError = new SyncedActivityModel();
                                                activityInError.type = <any> sportsLibActivity.type;
                                                activityInError.start_time = sportsLibActivity.startDate.toISOString();
                                                (<SyncedActivityModel> activityInError).extras = {fs_activity_location: activityFile.location}; // Keep tracking  of activity id
                                                const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.FILE_SYSTEM, errorMessage, activityInError,
                                                    (error.stack) ? error.stack : null);

                                                return Promise.reject(errorSyncEvent);
                                            }

                                            return Promise.resolve();

                                        } else {

                                            if (_.isArray(syncedActivityModels) && syncedActivityModels.length === 1) { // One activity found

                                                // Notify the new SyncedActivityModel
                                                syncEvents$.next(new ActivitySyncEvent(ConnectorType.FILE_SYSTEM,
                                                    null, <SyncedActivityModel> syncedActivityModels[0], false));
                                            } else {
                                                const activitiesFound = [];
                                                _.forEach(syncedActivityModels, (activityModel: SyncedActivityModel) => {
                                                    activitiesFound.push(activityModel.name + " (" + new Date(activityModel.start_time).toString() + ")");
                                                });
                                                const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
                                                const activityName = `${FileSystemConnector.HumanizedDayMoment.resolve(sportsLibActivity.startDate)} ${elevateSportResult.type}`;

                                                const errorSyncEvent = new ErrorSyncEvent(ConnectorType.FILE_SYSTEM,
                                                    ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(ConnectorType.FILE_SYSTEM, activityName,
                                                        sportsLibActivity.startDate, activitiesFound));

                                                syncEvents$.next(errorSyncEvent);
                                            }

                                            return Promise.resolve();
                                        }
                                    });
                            });

                        }, Promise.resolve());

                    }).catch(error => {

                        if (error.code) { // Already an ErrorSyncEvent
                            return Promise.reject(error);
                        }

                        if ((<EventLibError> error).event === null) { // No event available from sports-lib
                            logger.warn("No sports-lib event available. Skip " + activityFile.location.path);
                            return Promise.resolve();
                        }

                        const errorMessage = "Activity file parsing error: " + ((error.message) ? error.message : error.toString());
                        const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.FILE_SYSTEM, errorMessage, (error.stack) ? error.stack : null);
                        errorSyncEvent.activity = new SyncedActivityModel();
                        (<SyncedActivityModel> errorSyncEvent.activity).extras = {fs_activity_location: activityFile.location}; // Keep tracking  of activity id
                        return Promise.reject(errorSyncEvent);
                    });
                });

            }, Promise.resolve());
        });
    }

    public createBareActivity(sportsLibActivity: ActivityInterface): BareActivityModel {
        const bareActivityModel: BareActivityModel = <BareActivityModel> new SyncedActivityModel();
        bareActivityModel.id = BaseConnector.hashData(sportsLibActivity.startDate.toISOString());
        const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
        bareActivityModel.type = elevateSportResult.type;
        bareActivityModel.display_type = bareActivityModel.type;
        bareActivityModel.name = FileSystemConnector.HumanizedDayMoment.resolve(sportsLibActivity.startDate) + " " + bareActivityModel.type;

        if (elevateSportResult.autoDetected) {
            bareActivityModel.name += " #detected";
        }

        bareActivityModel.start_time = sportsLibActivity.startDate.toISOString();
        bareActivityModel.end_time = sportsLibActivity.endDate.toISOString();
        bareActivityModel.hasPowerMeter = sportsLibActivity.hasPowerMeter();
        bareActivityModel.trainer = sportsLibActivity.isTrainer();
        bareActivityModel.commute = null; // Unsupported at the moment
        return bareActivityModel;
    }

    public convertToElevateSport(sportsLibActivity: ActivityInterface): { type: ElevateSport, autoDetected: boolean } {
        const entryFound = _.find(FileSystemConnector.SPORTS_LIB_TYPES_MAP, {from: sportsLibActivity.type});
        if (entryFound) {
            return {type: entryFound.to, autoDetected: false};
        } else {
            if (this.detectSportTypeWhenUnknown) {
                const stats = sportsLibActivity.getStats();

                const distance = <number> stats.get(DataDistance.type)?.getValue();
                const duration = <number> stats.get(DataDuration.type)?.getValue();
                const ascent = <number> stats.get(DataAscent.type)?.getValue();
                const avgSpeed = <number> stats.get(DataSpeedAvg.type)?.getValue();
                const maxSpeed = <number> stats.get(DataSpeedMax.type)?.getValue();

                const elevateSport = this.attemptDetectCommonSport(distance, duration, ascent, avgSpeed, maxSpeed);
                return {type: elevateSport, autoDetected: (elevateSport !== ElevateSport.Other)};

            } else {
                return {type: ElevateSport.Other, autoDetected: false};
            }
        }
    }

    public attemptDetectCommonSport(distance: number, duration: number, ascent: number, avgSpeed: number, maxSpeed: number): ElevateSport {

        const MAX_CYCLING_SPEED_THRESHOLD = 100 / 3.6; // 100kph
        const MAX_RUNNING_SPEED_THRESHOLD = 40 / 3.6; // 40kph

        /**
         * Modelize the max possible running average speed to perform the given distance
         *
         * Data:
         * meters, avg kph
         * -----------
         * 0.4, 33.4
         * 1, 27
         * 5, 23.7
         * 10, 22.7
         * 21, 21.7
         * 42, 20.71
         * @param meters running distance
         * @return max running average speed in m/s
         */
        const maxAvgRunningSpeedForDistance = (meters: number): number => {
            const perfRatio = 0.80; // Percentage of performance reachable by a well trained athlete (1 => world record);
            const y0 = 21.485097981749487;
            const a = 7.086180143945561;
            const x0 = -0.19902800428936693;
            return (y0 + a / ((meters / 1000) - x0)) / 3.6 * perfRatio;
        };

        /**
         * Detect if entry param could have been performed with or without climb assitance
         */
        const isAssisted = (pMaxSpeed: number, pDistance: number, pDuration: number, pAscent: number): boolean => {
            const criteria = (Math.pow(pAscent, 2) / ((pDistance / 1000) * (pDuration / 60))) / 1000;
            return criteria >= 1;
        };

        if (maxSpeed > 0) {
            if (maxSpeed >= MAX_CYCLING_SPEED_THRESHOLD || maxSpeed >= MAX_RUNNING_SPEED_THRESHOLD) {
                return isAssisted(maxSpeed, distance, duration, ascent) ? ElevateSport.Other : ElevateSport.Ride;
            }
        }

        if (avgSpeed > 0 && distance > 0 && maxSpeed > 0) {
            const maxAvgRunningSpeed = maxAvgRunningSpeedForDistance(distance);

            const grade = ascent / distance * 1000;
            const gradeSpeed = avgSpeed + avgSpeed * (grade / 100) * 1.5;

            if (gradeSpeed > maxAvgRunningSpeed) {
                return isAssisted(maxSpeed, distance, duration, ascent) ? ElevateSport.Other : ElevateSport.Ride;
            } else {

                const highlightRideActivity = ((Math.pow(maxSpeed - avgSpeed, 3) * Math.pow(maxSpeed, 4)) / Math.pow(10, 4) * 2) / 5;
                const decisionSecureTolerance = 0.2;

                const isRide = highlightRideActivity > (1 + decisionSecureTolerance);
                if (isRide) {
                    return ElevateSport.Ride;
                }

                const isRun = highlightRideActivity < (1 - decisionSecureTolerance);
                if (isRun) {
                    return ElevateSport.Run;
                }
            }
        }

        return ElevateSport.Other;
    }

    /**
     * Get primitive data from files parsed by the sports-lib
     */
    public extractPrimitiveSourceData(sportsLibActivity: ActivityInterface): PrimitiveSourceData {

        const elapsedTimeRaw = (sportsLibActivity.getDuration() && _.isNumber(sportsLibActivity.getDuration().getValue())) ? sportsLibActivity.getDuration().getValue() : null;
        const pauseTime = (sportsLibActivity.getPause() && _.isNumber(sportsLibActivity.getPause().getValue())) ? sportsLibActivity.getPause().getValue() : null;

        let movingTimeRaw;
        if (_.isNumber(elapsedTimeRaw) && _.isNumber(pauseTime)) {
            movingTimeRaw = elapsedTimeRaw - pauseTime;
        } else if (_.isNumber(elapsedTimeRaw) && !_.isNumber(pauseTime)) {
            movingTimeRaw = elapsedTimeRaw;
        } else {
            movingTimeRaw = null;
        }

        const distanceRaw = (sportsLibActivity.getDistance() && _.isNumber(sportsLibActivity.getDistance().getValue())) ? sportsLibActivity.getDistance().getValue() : null;
        const elevationGainRaw = (sportsLibActivity.getStats().get(DataAscent.type) && _.isNumber(sportsLibActivity.getStats().get(DataAscent.type).getValue()))
            ? <number> sportsLibActivity.getStats().get(DataAscent.type).getValue() : null;
        return new PrimitiveSourceData(elapsedTimeRaw, movingTimeRaw, distanceRaw, elevationGainRaw);
    }

    public extractActivityStreams(sportsLibActivity: ActivityInterface): ActivityStreamsModel {

        const activityStreamsModel: ActivityStreamsModel = new ActivityStreamsModel();

        // Time via distance stream
        try {
            activityStreamsModel.time = sportsLibActivity.generateTimeStream([DataDistance.type]).getData(true, true);
        } catch (err) {
            logger.info("No distance stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Lat long
        try {
            const longitudes = sportsLibActivity.getSquashedStreamData(DataLongitudeDegrees.type);
            const latitudes = sportsLibActivity.getSquashedStreamData(DataLatitudeDegrees.type);
            activityStreamsModel.latlng = latitudes.map((latitude, index) => {
                return [_.floor(latitude, 8), _.floor(longitudes[index], 8)];
            });
        } catch (err) {
            logger.info("No lat or lon streams found for activity starting at " + sportsLibActivity.startDate);
        }

        // Distance
        try {
            activityStreamsModel.distance = sportsLibActivity.getSquashedStreamData(DataDistance.type);
        } catch (err) {
            logger.info("No distance stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Speed
        try {
            activityStreamsModel.velocity_smooth = sportsLibActivity.getSquashedStreamData(DataSpeed.type);
        } catch (err) {
            logger.info("No speed stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // HeartRate
        try {
            activityStreamsModel.heartrate = sportsLibActivity.getSquashedStreamData(DataHeartRate.type);
        } catch (err) {
            logger.info("No heartrate stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Altitude
        try {
            activityStreamsModel.altitude = sportsLibActivity.getSquashedStreamData(DataAltitude.type);
        } catch (err) {
            logger.info("No altitude stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Cadence
        try {
            activityStreamsModel.cadence = sportsLibActivity.getSquashedStreamData(DataCadence.type);
        } catch (err) {
            logger.info("No cadence stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Watts
        try {
            activityStreamsModel.watts = sportsLibActivity.getSquashedStreamData(DataPower.type);
        } catch (err) {
            logger.info("No power stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Grade
        try {
            activityStreamsModel.grade_smooth = sportsLibActivity.getSquashedStreamData(DataGrade.type);
        } catch (err) {
            logger.info("No grade stream found for activity starting at " + sportsLibActivity.startDate);
        }

        // Grade adjusted speed
        try {
            if (ActivityTypesHelper.getActivityGroupForActivityType(sportsLibActivity.type) === ActivityTypeGroups.Running) {
                activityStreamsModel.grade_adjusted_speed = sportsLibActivity.getSquashedStreamData(DataGradeAdjustedSpeed.type);
            }
        } catch (err) {
            logger.info("No grade adjusted speed stream found for activity starting at " + sportsLibActivity.startDate);
        }


        return activityStreamsModel;
    }

    public computeAdditionalStreams(bareActivityModel: BareActivityModel, activityStreamsModel: ActivityStreamsModel,
                                    athleteSettingsModel: AthleteSettingsModel): ActivityStreamsModel {

        if (!_.isEmpty(activityStreamsModel.grade_smooth)) {

            // Estimated power
            try {
                if (!bareActivityModel.hasPowerMeter && (bareActivityModel.type === ElevateSport.Ride || bareActivityModel.type === ElevateSport.VirtualRide)) {
                    activityStreamsModel.watts = this.estimateCyclingPowerStream(bareActivityModel.type,
                        activityStreamsModel.velocity_smooth, activityStreamsModel.grade_smooth, athleteSettingsModel.weight);
                } else {
                }
                delete activityStreamsModel.watts_calc;
            } catch (err) {
                logger.info(err.message, err);
                delete activityStreamsModel.watts_calc;
            }
        }

        return activityStreamsModel;
    }

    public scanForActivities(directory: string, afterDate: Date = null, recursive: boolean = false, pathsList = []): ActivityFile[] {

        const files = fs.readdirSync(directory);

        const trackFile = (absolutePath: string, type: ActivityFileType, lastModificationDate: Date): void => {
            const fileData = fs.readFileSync(absolutePath);
            const sha1 = BaseConnector.hashData(fileData);
            pathsList.push(new ActivityFile(type, absolutePath, this.athleteMachineId, lastModificationDate, sha1));
        };

        files.forEach(file => {

            const isDirectory = fs.statSync(directory + "/" + file).isDirectory();

            if (recursive && isDirectory) {
                pathsList.push(this.scanForActivities(directory + "/" + file, afterDate, recursive, []));
            }

            if (!isDirectory) {
                const fileExtension = path.extname(file).slice(1);
                if (fileExtension === ActivityFileType.GPX || fileExtension === ActivityFileType.TCX || fileExtension === ActivityFileType.FIT) {
                    const absolutePath = path.join(directory, file);
                    const lastAccessDate = this.getLastAccessDate(absolutePath);
                    if (afterDate) {
                        if (lastAccessDate.getTime() >= afterDate.getTime()) {
                            trackFile(absolutePath, fileExtension, lastAccessDate);
                        }
                    } else {
                        trackFile(absolutePath, fileExtension, lastAccessDate);
                    }
                }
            }
        });

        return (recursive) ? _.flatten(pathsList) : pathsList;
    }

    public getLastAccessDate(absolutePath: string): Date {
        const stats = fs.statSync(absolutePath);
        return stats.atime;
    }

    public deflateActivitiesFromArchive(archiveFilePath: string, deleteArchive: boolean = false): Promise<string[]> {

        return new Promise((resolve, reject) => {

            const fileName = path.basename(archiveFilePath);
            const currentArchiveDir = path.dirname(archiveFilePath);
            const archiveFileNameFingerPrint = BaseConnector.hashData(fileName, 6);
            const extractDir = currentArchiveDir + "/" + archiveFileNameFingerPrint;

            // Create extract directory
            if (fs.existsSync(extractDir)) {
                fs.rmdirSync(extractDir, {recursive: true});
            }
            fs.mkdirSync(extractDir);

            const options: any = {
                targetDir: extractDir,
                noDirectory: true,
                quiet: true
            };

            // Append resources path to unar exec (unarchiver) if app is packaged
            if (Service.instance().isPackaged && !Service.instance().isLinux()) {
                options.unar = Service.instance().getResourceFolder() + "/app.asar.unpacked/node_modules/all-unpacker/unar";
            }

            FileSystemConnector.getAllUnPacker().unpack(archiveFilePath, options, err => {
                if (err) {
                    fs.rmdirSync(extractDir, {recursive: true});
                    reject(err);
                } else {
                    // When archive un-packaged
                    try {
                        const extractedActivityFiles = this.scanForActivities(extractDir, null, true);
                        const trackedNewPaths = [];
                        extractedActivityFiles.forEach(extractedActivityFile => {
                            const extractedFileName = path.basename(extractedActivityFile.location.path);
                            const extractedDirName = path.dirname(extractedActivityFile.location.path);
                            const relativeExtractedDirName = extractedDirName
                                .slice(currentArchiveDir.length + archiveFileNameFingerPrint.length + 1)
                                .replace(/\\/gm, "/");
                            const newActivityPath = currentArchiveDir + "/" + archiveFileNameFingerPrint
                                + ((relativeExtractedDirName) ? "-" + BaseConnector.hashData(relativeExtractedDirName, 6) : "") + "-" + extractedFileName;
                            fs.renameSync(extractedActivityFile.location.path, newActivityPath);
                            trackedNewPaths.push(newActivityPath);
                        });

                        // Remove extract directory
                        fs.rmdirSync(extractDir, {recursive: true});

                        if (deleteArchive) {
                            fs.unlinkSync(archiveFilePath);
                        }

                        resolve(trackedNewPaths);
                    } catch (err) {
                        fs.rmdirSync(extractDir, {recursive: true});
                        reject(err);
                    }
                }
            });
        });
    }

    /**
     *
     * @return Observable of archive paths being deflated.
     */
    public scanDeflateActivitiesFromArchives(sourceDir: string, deleteArchives: boolean, deflateNotifier: Subject<string> = new Subject<string>(),
                                             recursive: boolean = false): Promise<void> {

        const files = fs.readdirSync(sourceDir);

        return files.reduce((previousPromise: Promise<void>, file: string) => {

            return previousPromise.then(() => {

                const isDirectory = fs.statSync(sourceDir + "/" + file).isDirectory();

                if (recursive && isDirectory) {
                    return this.scanDeflateActivitiesFromArchives(sourceDir + "/" + file, deleteArchives, deflateNotifier, recursive);
                }

                if (!isDirectory) {
                    const absolutePath = path.join(sourceDir, file);
                    const fileExtension = path.extname(file).slice(1);
                    const isArchiveFile = (["zip", "rar", "gz", "tar", "7z", "bz2", "zipx", "xz"].indexOf(fileExtension) !== -1);
                    if (isArchiveFile) {
                        return this.deflateActivitiesFromArchive(absolutePath, deleteArchives).then(() => {
                            if (deflateNotifier) {
                                deflateNotifier.next(absolutePath);
                            }
                            return Promise.resolve();
                        });
                    }
                }

                return Promise.resolve();
            });

        }, Promise.resolve()).then(() => {
            if (deflateNotifier) {
                deflateNotifier.complete();
            }
            return Promise.resolve();
        });
    }
}
