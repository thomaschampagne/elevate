import { BaseConnector } from "../base.connector";
import { ActivitySyncEvent, ConnectorType, ErrorSyncEvent, GenericSyncEvent, StartedSyncEvent, StoppedSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { ReplaySubject, Subject } from "rxjs";
import { ActivityStreamsModel, AthleteModel, AthleteSettingsModel, BareActivityModel, ConnectorSyncDateTime, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { Service } from "../../service";
import * as xmldom from "xmldom";
import { EventInterface } from "sports-lib/lib/events/event.interface";
import { ActivityInterface } from "sports-lib/lib/activities/activity.interface";
import { ElevateSport } from "@elevate/shared/enums";
import { DataAscent } from "sports-lib/lib/data/data.ascent";
import { SportsLib } from "sports-lib";
import { ActivityTypes } from "sports-lib/lib/activities/activity.types";
import { DataSpeed } from "sports-lib/lib/data/data.speed";
import { DataLongitudeDegrees } from "sports-lib/lib/data/data.longitude-degrees";
import { DataLatitudeDegrees } from "sports-lib/lib/data/data.latitude-degrees";
import { DataDistance } from "sports-lib/lib/data/data.distance";
import { DataAltitude } from "sports-lib/lib/data/data.altitude";
import { DataCadence } from "sports-lib/lib/data/data.cadence";
import { DataHeartRate } from "sports-lib/lib/data/data.heart-rate";
import { DataPower } from "sports-lib/lib/data/data.power";
import logger from "electron-log";
import { GradeCalculator } from "./grade-calculator/grade-calculator";
import { CyclingPower } from "./cycling-power-estimator/cycling-power-estimator";
import { Partial } from "rollup-plugin-typescript2/dist/partial";
import { ElevateException } from "@elevate/shared/exceptions";
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

	/**
	 *
	 * @param type
	 * @param absolutePath
	 * @param machineId
	 * @param lastModificationDate
	 * @param hash as sha01
	 */
	constructor(type: ActivityFileType, absolutePath: string, machineId: string, lastModificationDate: Date, hash: string) {
		this.type = type;
		this.location = {onMachineId: machineId, path: absolutePath};
		this.lastModificationDate = _.isDate(lastModificationDate) ? lastModificationDate.toISOString() : null;
	}
}

export class FileSystemConnector extends BaseConnector {

	constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel,
				connectorSyncDateTime: ConnectorSyncDateTime, inputDirectory: string, scanSubDirectories: boolean,
				deleteActivityFilesAfterSync: boolean, extractArchiveFiles: boolean, deleteArchivesAfterExtract: boolean) {
		super(ConnectorType.FILE_SYSTEM, athleteModel, userSettingsModel, connectorSyncDateTime, priority, FileSystemConnector.ENABLED);
		this.inputDirectory = inputDirectory;
		this.scanSubDirectories = scanSubDirectories;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.extractArchiveFiles = extractArchiveFiles;
		this.deleteArchivesAfterExtract = deleteArchivesAfterExtract;
		this.athleteMachineId = Service.instance().getRuntimeInfo().athleteMachineId;
	}

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
		{from: ActivityTypes.UnknownSport, to: ElevateSport.Other},
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

	public static readonly UNPACKER = require("all-unpacker");

	public inputDirectory: string;
	public scanSubDirectories: boolean;
	public deleteActivityFilesAfterSync: boolean;
	public extractArchiveFiles: boolean;
	public deleteArchivesAfterExtract: boolean;
	public athleteMachineId: string;


	public static create(athleteModel: AthleteModel, userSettingsModel: UserSettings.UserSettingsModel,
						 connectorSyncDateTime: ConnectorSyncDateTime, inputDirectory: string, scanSubDirectories: boolean = false,
						 deleteActivityFilesAfterSync: boolean = false, extractArchiveFiles: boolean = false, deleteArchivesAfterExtract: boolean = false) {
		return new FileSystemConnector(null, athleteModel, userSettingsModel, connectorSyncDateTime, inputDirectory, scanSubDirectories,
			deleteActivityFilesAfterSync, extractArchiveFiles, deleteArchivesAfterExtract);
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

		const afterDate = this.syncDateTime ? new Date(this.syncDateTime * 1000) : null;

		let prepareScanDirectory: Promise<void> = Promise.resolve();

		if (!afterDate && this.extractArchiveFiles) {
			const deflateNotifier = new Subject<string>();
			deflateNotifier.subscribe(extractedArchivePath => {
				const extractedArchiveFileName = path.basename(extractedArchivePath);
				syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE_SYSTEM, `Activities in "${extractedArchiveFileName}" file have been extracted.`));
			});
			prepareScanDirectory = this.scanDeflateActivitiesFromArchives(this.inputDirectory, this.deleteArchivesAfterExtract, deflateNotifier, this.scanSubDirectories);
		}

		return prepareScanDirectory.then(() => {

			const activityFiles: ActivityFile[] = this.scanForActivities(this.inputDirectory, afterDate, this.scanSubDirectories);
			return Promise.resolve(activityFiles);

		}).then(activityFiles => {

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

								return this.findSyncedActivityModels(sportsLibActivity.startDate.toISOString(), sportsLibActivity.getDuration().getValue())
									.then((syncedActivityModels: SyncedActivityModel[]) => {
										if (_.isEmpty(syncedActivityModels)) {

											try {
												// Create bare activity from "sports-lib" activity
												const bareActivity = this.createBareActivity(sportsLibActivity);

												const syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
												syncedActivityModel.start_timestamp = new Date(bareActivity.start_time).getTime() / 1000;

												// Assign reference to strava activity
												syncedActivityModel.extras = {fs_activity_location: activityFile.location}; // Keep tracking  of activity id
												syncedActivityModel.id = BaseConnector.hashData(syncedActivityModel.start_time, 6) + "-" + BaseConnector.hashData(syncedActivityModel.end_time, 6);

												// Resolve athlete snapshot for current activity date
												syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(syncedActivityModel.start_time);

												// Prepare streams
												const activityStreamsModel = this.appendAdditionalStreams(bareActivity,
													this.extractActivityStreams(sportsLibActivity), syncedActivityModel.athleteSnapshot.athleteSettings);

												// Compute activity
												syncedActivityModel.extendedStats = this.computeExtendedStats(syncedActivityModel,
													syncedActivityModel.athleteSnapshot, this.userSettingsModel, activityStreamsModel);

												// Update
												if (syncedActivityModel.extendedStats) {
													syncedActivityModel.moving_time_raw = (syncedActivityModel.extendedStats.moveRatio >= 0)
														? syncedActivityModel.elapsed_time_raw * syncedActivityModel.extendedStats.moveRatio : null;

													if (syncedActivityModel.extendedStats.elevationData && syncedActivityModel.extendedStats.elevationData.accumulatedElevationAscent >= 0) {
														syncedActivityModel.elevation_gain_raw = Math.round(syncedActivityModel.extendedStats.elevationData.accumulatedElevationAscent);
													} else {
														syncedActivityModel.elevation_gain_raw = null;
													}
												}

												// Track connector type
												syncedActivityModel.sourceConnectorType = ConnectorType.FILE_SYSTEM;

												// Gunzip stream as base64
												const compressedStream = (activityStreamsModel) ? ActivityStreamsModel.inflate(activityStreamsModel) : null;

												// Notify the new SyncedActivityModel
												syncEvents$.next(new ActivitySyncEvent(ConnectorType.FILE_SYSTEM,
													null, <SyncedActivityModel> syncedActivityModel, true, compressedStream));

											} catch (error) {
												const errorMessage = "Unable to compute activity started '"
													+ sportsLibActivity.startDate.toISOString() + "' cause: " + ((error.message) ? error.message : error.toString());
												const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.FILE_SYSTEM, errorMessage, (error.stack) ? error.stack : null);
												errorSyncEvent.activity = new SyncedActivityModel();
												errorSyncEvent.activity.type = <any> sportsLibActivity.type;
												errorSyncEvent.activity.start_time = sportsLibActivity.startDate.toISOString();
												(<SyncedActivityModel> errorSyncEvent.activity).extras = {fs_activity_location: activityFile.location}; // Keep tracking  of activity id

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

												const activityName = `${FileSystemConnector.HumanizedDayMoment.resolve(sportsLibActivity.startDate)} ${this.convertToElevateSport(sportsLibActivity.type)}`;

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
		bareActivityModel.type = this.convertToElevateSport(sportsLibActivity.type);
		bareActivityModel.display_type = bareActivityModel.type;
		bareActivityModel.name = FileSystemConnector.HumanizedDayMoment.resolve(sportsLibActivity.startDate) + " " + bareActivityModel.type;
		bareActivityModel.start_time = sportsLibActivity.startDate.toISOString();
		bareActivityModel.end_time = sportsLibActivity.endDate.toISOString();

		if (sportsLibActivity.getDistance()) {
			bareActivityModel.distance_raw = (sportsLibActivity.getDistance().getValue()) ? sportsLibActivity.getDistance().getValue() : null;
		} else {
			bareActivityModel.distance_raw = null;
		}

		if (sportsLibActivity.getStats().get(DataAscent.type)) {
			const ascentValue = sportsLibActivity.getStats().get(DataAscent.type).getValue();
			bareActivityModel.elevation_gain_raw = <number> ((ascentValue > 0) ? ascentValue : null);
		} else {
			bareActivityModel.elevation_gain_raw = null;
		}

		if (sportsLibActivity.getDuration()) {
			bareActivityModel.elapsed_time_raw = (sportsLibActivity.getDuration().getValue()) ? sportsLibActivity.getDuration().getValue() : null;
		} else {
			bareActivityModel.elapsed_time_raw = null;
		}

		bareActivityModel.hasPowerMeter = sportsLibActivity.hasPowerMeter();
		bareActivityModel.trainer = sportsLibActivity.isTrainer();
		bareActivityModel.commute = null; // Unsupported at the moment
		return bareActivityModel;
	}


	/**
	 *
	 * @param sportsLibType
	 */
	public convertToElevateSport(sportsLibType: string): ElevateSport {
		const entryFound = _.find(FileSystemConnector.SPORTS_LIB_TYPES_MAP, {from: sportsLibType});
		return entryFound ? entryFound.to : ElevateSport.Other;
	}

	/**
	 *
	 * @param sportsLibActivity
	 */
	public extractActivityStreams(sportsLibActivity: ActivityInterface): ActivityStreamsModel {

		const activityStreamsModel: ActivityStreamsModel = new ActivityStreamsModel();

		// Time via distance stream
		try {
			activityStreamsModel.time = sportsLibActivity.getStream(DataDistance.type).getDurationOfData(true, true);
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

		return activityStreamsModel;
	}

	public appendAdditionalStreams(bareActivityModel: BareActivityModel, activityStreamsModel: ActivityStreamsModel,
								   athleteSettingsModel: AthleteSettingsModel): ActivityStreamsModel {

		// Grade
		try {
			if (!_.isEmpty(activityStreamsModel.distance) && !_.isEmpty(activityStreamsModel.altitude)) {
				activityStreamsModel.grade_smooth = this.calculateGradeStream(activityStreamsModel.distance, activityStreamsModel.altitude);
			}

		} catch (err) {
			logger.info(err.message, err);
		}

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

			// Grade adjusted speed
			try {
				if (bareActivityModel.type === ElevateSport.Run || bareActivityModel.type === ElevateSport.VirtualRun) {
					activityStreamsModel.grade_adjusted_speed = this.calculateGradeAdjustedSpeed(bareActivityModel.type,
						activityStreamsModel.velocity_smooth, activityStreamsModel.grade_smooth);
				}
			} catch (err) {
				logger.info(err.message, err);
			}
		}

		return activityStreamsModel;
	}

	public calculateGradeStream(distanceStream: number[], altitudeStream: number[]): number[] {

		if (_.isEmpty(distanceStream)) {
			throw new ElevateException("Distance stream cannot be empty to calculate grade stream");
		}

		if (_.isEmpty(altitudeStream)) {
			throw new ElevateException("Altitude stream cannot be empty to calculate grade stream");
		}

		return GradeCalculator.computeGradeStream(distanceStream, altitudeStream);
	}

	public calculateGradeAdjustedSpeed(type: ElevateSport, velocityStream: number[], gradeStream: number[]): number[] {

		if (_.isEmpty(velocityStream)) {
			throw new ElevateException("Velocity stream cannot be empty to calculate grade adjusted speed stream");
		}

		if (_.isEmpty(gradeStream)) {
			throw new ElevateException("Grade stream cannot be empty to calculate grade adjusted speed stream");
		}

		if (type !== ElevateSport.Run && type !== ElevateSport.VirtualRun) {
			throw new ElevateException(`Cannot compute grade adjusted speed data on activity type: ${type}. Must be running like.`);
		}

		const gradeAdjustedSpeedStream = [];

		for (let i = 0; i < velocityStream.length; i++) {
			const mps = velocityStream[i];
			const adjustedSpeed = GradeCalculator.estimateAdjustedSpeed(mps, gradeStream[i]);
			gradeAdjustedSpeedStream.push(adjustedSpeed);
		}

		return gradeAdjustedSpeedStream;
	}

	public estimateCyclingPowerStream(type: ElevateSport, velocityStream: number[], gradeStream: number[], riderWeight: number): number[] {

		if (_.isEmpty(velocityStream)) {
			throw new ElevateException("Velocity stream cannot be empty to calculate grade stream");
		}

		if (_.isEmpty(gradeStream)) {
			throw new ElevateException("Grade stream cannot be empty to calculate grade stream");
		}

		if (type !== ElevateSport.Ride && type !== ElevateSport.VirtualRide) {
			throw new ElevateException(`Cannot compute estimated cycling power data on activity type: ${type}. Must be done with a bike.`);
		}

		if (!riderWeight || riderWeight < 0) {
			throw new ElevateException(`Cannot compute estimated cycling power with a rider weight of ${riderWeight}`);
		}

		const powerEstimatorParams: Partial<CyclingPower.Params> = {
			riderWeightKg: riderWeight
		};

		const estimatedPowerStream = [];

		for (let i = 0; i < velocityStream.length; i++) {
			const kph = velocityStream[i] * 3.6;
			powerEstimatorParams.gradePercentage = gradeStream[i];
			const power = CyclingPower.Estimator.calc(kph, powerEstimatorParams);
			estimatedPowerStream.push(power);
		}

		return estimatedPowerStream;
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
					const lastModificationDate = this.getLastModificationDate(absolutePath);
					if (afterDate) {
						if (lastModificationDate.getTime() >= afterDate.getTime()) {
							trackFile(absolutePath, fileExtension, lastModificationDate);
						}
					} else {
						trackFile(absolutePath, fileExtension, lastModificationDate);
					}
				}
			}
		});

		return (recursive) ? _.flatten(pathsList) : pathsList;
	}

	public getLastModificationDate(absolutePath: string): Date {
		const stats = fs.statSync(absolutePath);
		return stats.mtime;
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

			FileSystemConnector.UNPACKER.unpack(archiveFilePath, {
				targetDir: extractDir,
				noDirectory: true,
				quiet: true,
			}, (err) => {
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
	 * @param sourceDir
	 * @param deleteArchives
	 * @param deflateNotifier
	 * @param recursive
	 */
	public scanDeflateActivitiesFromArchives(sourceDir: string, deleteArchives: boolean, deflateNotifier: Subject<string> = new Subject<string>(), recursive: boolean = false): Promise<void> {

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
