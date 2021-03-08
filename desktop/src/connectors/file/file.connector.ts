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
import { BareActivityModel, Streams, SyncedActivityModel } from "@elevate/shared/models";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { AppService } from "../../app-service";
import xmldom from "xmldom";
import { ElevateSport } from "@elevate/shared/enums";
import {
  ActivityTypeGroups,
  ActivityTypes,
  ActivityTypesHelper
} from "@sports-alliance/sports-lib/lib/activities/activity.types";
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
import { FileConnectorConfig } from "../connector-config.model";
import { inject, singleton } from "tsyringe";
import { Hash } from "../../tools/hash";
import { sleep } from "@elevate/shared/tools";
import { UnArchiver } from "./un-archiver";
import { DataTemperature } from "@sports-alliance/sports-lib/lib/data/data.temperature";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";

export enum ActivityFileType {
  GPX = "gpx",
  TCX = "tcx",
  FIT = "fit"
}

/**
 * Model associated to File synced activities
 */
export class ActivityFile {
  public type: ActivityFileType;
  public location: { path: string };
  public lastModificationDate: string;

  constructor(type: ActivityFileType, absolutePath: string, lastModificationDate: Date) {
    this.type = type;
    this.location = { path: absolutePath };
    this.lastModificationDate = _.isDate(lastModificationDate) ? lastModificationDate.toISOString() : null;
  }
}

@singleton()
export class FileConnector extends BaseConnector {
  private static readonly SLEEP_TIME_BETWEEN_FILE_PARSED: number = 100;

  private static HumanizedDayMoment = class {
    private static readonly SPLIT_AFTERNOON_AT = 12;
    private static readonly SPLIT_EVENING_AT = 17;
    private static readonly MORNING = "Morning";
    private static readonly AFTERNOON = "Afternoon";
    private static readonly EVENING = "Evening";

    public static resolve(date: Date): string {
      const currentHour = date.getHours();
      if (
        currentHour >= FileConnector.HumanizedDayMoment.SPLIT_AFTERNOON_AT &&
        currentHour <= FileConnector.HumanizedDayMoment.SPLIT_EVENING_AT
      ) {
        // Between 12 PM and 5PM
        return FileConnector.HumanizedDayMoment.AFTERNOON;
      } else if (currentHour >= FileConnector.HumanizedDayMoment.SPLIT_EVENING_AT) {
        return FileConnector.HumanizedDayMoment.EVENING;
      }
      return FileConnector.HumanizedDayMoment.MORNING;
    }
  };
  private static readonly ENABLED: boolean = true;
  private static readonly SPORTS_LIB_TO_ELEVATE_SPORTS_MAP: Map<ActivityTypes, ElevateSport> = new Map<
    ActivityTypes,
    ElevateSport
  >([
    [ActivityTypes.Aerobics, ElevateSport.Cardio],
    [ActivityTypes.AlpineSkiing, ElevateSport.AlpineSki],
    [ActivityTypes.AmericanFootball, ElevateSport.AmericanFootball],
    [ActivityTypes.Aquathlon, ElevateSport.Aquathlon],
    [ActivityTypes.BackcountrySkiing, ElevateSport.BackcountrySki],
    [ActivityTypes.Badminton, ElevateSport.Badminton],
    [ActivityTypes.Baseball, ElevateSport.Baseball],
    [ActivityTypes.Basketball, ElevateSport.Basketball],
    [ActivityTypes.Boxing, ElevateSport.Boxing],
    [ActivityTypes.Canoeing, ElevateSport.Canoeing],
    [ActivityTypes.CardioTraining, ElevateSport.Cardio],
    [ActivityTypes.Climbing, ElevateSport.Climbing],
    [ActivityTypes.Combat, ElevateSport.Combat],
    [ActivityTypes.Cricket, ElevateSport.Cricket],
    [ActivityTypes.Crossfit, ElevateSport.Crossfit],
    [ActivityTypes.CrosscountrySkiing, ElevateSport.NordicSki],
    [ActivityTypes.Crosstrainer, ElevateSport.Elliptical],
    [ActivityTypes.Cycling, ElevateSport.Ride],
    [ActivityTypes.Dancing, ElevateSport.Dance],
    [ActivityTypes.Diving, ElevateSport.Diving],
    [ActivityTypes.DownhillSkiing, ElevateSport.AlpineSki],
    [ActivityTypes.Driving, ElevateSport.Drive],
    [ActivityTypes.Duathlon, ElevateSport.Duathlon],
    [ActivityTypes.EBiking, ElevateSport.EBikeRide],
    [ActivityTypes.EllipticalTrainer, ElevateSport.Elliptical],
    [ActivityTypes.Fishing, ElevateSport.Fishing],
    [ActivityTypes.FitnessEquipment, ElevateSport.Workout],
    [ActivityTypes.FlexibilityTraining, ElevateSport.Workout],
    [ActivityTypes.FloorClimbing, ElevateSport.Workout],
    [ActivityTypes.Floorball, ElevateSport.Workout],
    [ActivityTypes.Flying, ElevateSport.Flying],
    [ActivityTypes.Football, ElevateSport.Football],
    [ActivityTypes.FreeDiving, ElevateSport.Diving],
    [ActivityTypes.Frisbee, ElevateSport.Frisbee],
    [ActivityTypes.Generic, ElevateSport.Workout],
    [ActivityTypes.Golf, ElevateSport.Golf],
    [ActivityTypes.Gymnastics, ElevateSport.Gymnastics],
    [ActivityTypes.Handcycle, ElevateSport.Handcycle],
    [ActivityTypes.Handball, ElevateSport.Handball],
    [ActivityTypes.HangGliding, ElevateSport.HangGliding],
    [ActivityTypes.Hiking, ElevateSport.Hike],
    [ActivityTypes.HorsebackRiding, ElevateSport.HorsebackRiding],
    [ActivityTypes.IceHockey, ElevateSport.IceHockey],
    [ActivityTypes.IceSkating, ElevateSport.IceSkate],
    [ActivityTypes.IndoorCycling, ElevateSport.Ride],
    [ActivityTypes.IndoorRowing, ElevateSport.Rowing],
    [ActivityTypes.IndoorRunning, ElevateSport.Run],
    [ActivityTypes.IndoorTraining, ElevateSport.Workout],
    [ActivityTypes.InlineSkating, ElevateSport.InlineSkate],
    [ActivityTypes.Kayaking, ElevateSport.Kayaking],
    [ActivityTypes.Kettlebell, ElevateSport.WeightTraining],
    [ActivityTypes.Kitesurfing, ElevateSport.Kitesurf],
    [ActivityTypes.Motorcycling, ElevateSport.MotorSports],
    [ActivityTypes.Motorsports, ElevateSport.MotorSports],
    [ActivityTypes.MountainBiking, ElevateSport.Ride],
    [ActivityTypes.Mountaineering, ElevateSport.Mountaineering],
    [ActivityTypes.NordicWalking, ElevateSport.Walk],
    [ActivityTypes.OpenWaterSwimming, ElevateSport.Swim],
    [ActivityTypes.Orienteering, ElevateSport.Orienteering],
    [ActivityTypes.Paddling, ElevateSport.Canoeing],
    [ActivityTypes.Paragliding, ElevateSport.Paragliding],
    [ActivityTypes.Rafting, ElevateSport.Canoeing],
    [ActivityTypes.RockClimbing, ElevateSport.RockClimbing],
    [ActivityTypes.RollerSki, ElevateSport.RollerSki],
    [ActivityTypes.Rowing, ElevateSport.Rowing],
    [ActivityTypes.Rugby, ElevateSport.Rugby],
    [ActivityTypes.Running, ElevateSport.Run],
    [ActivityTypes.Sailing, ElevateSport.Sailing],
    [ActivityTypes.ScubaDiving, ElevateSport.Diving],
    [ActivityTypes.SkiTouring, ElevateSport.SkiTouring],
    [ActivityTypes.SkyDiving, ElevateSport.SkyDiving],
    [ActivityTypes.Snorkeling, ElevateSport.Snorkeling],
    [ActivityTypes.Snowboarding, ElevateSport.Snowboard],
    [ActivityTypes.Snowmobiling, ElevateSport.Snowmobiling],
    [ActivityTypes.Snowshoeing, ElevateSport.Snowshoe],
    [ActivityTypes.Soccer, ElevateSport.Football],
    [ActivityTypes.Softball, ElevateSport.Softball],
    [ActivityTypes.Squash, ElevateSport.Squash],
    [ActivityTypes.StairStepper, ElevateSport.StairStepper],
    [ActivityTypes.StandUpPaddling, ElevateSport.StandUpPaddling],
    [ActivityTypes.StrengthTraining, ElevateSport.WeightTraining],
    [ActivityTypes.Stretching, ElevateSport.Stretching],
    [ActivityTypes.Surfing, ElevateSport.Surfing],
    [ActivityTypes.Swimming, ElevateSport.Swim],
    [ActivityTypes.Swimrun, ElevateSport.Workout],
    [ActivityTypes.TableTennis, ElevateSport.TableTennis],
    [ActivityTypes.Tactical, ElevateSport.Tactical],
    [ActivityTypes.TelemarkSkiing, ElevateSport.TelemarkSki],
    [ActivityTypes.Tennis, ElevateSport.Tennis],
    [ActivityTypes.TrackAndField, ElevateSport.TrackAndField],
    [ActivityTypes.TrailRunning, ElevateSport.Run],
    [ActivityTypes.Training, ElevateSport.Workout],
    [ActivityTypes.Treadmill, ElevateSport.Run],
    [ActivityTypes.Trekking, ElevateSport.Hike],
    [ActivityTypes.Triathlon, ElevateSport.Triathlon],
    [ActivityTypes.Velomobile, ElevateSport.Velomobile],
    [ActivityTypes.VirtualCycling, ElevateSport.VirtualRide],
    [ActivityTypes.VirtualRunning, ElevateSport.VirtualRun],
    [ActivityTypes.Volleyball, ElevateSport.Volleyball],
    [ActivityTypes.Wakeboarding, ElevateSport.Wakeboarding],
    [ActivityTypes.Walking, ElevateSport.Walk],
    [ActivityTypes.WaterSkiing, ElevateSport.WaterSkiing],
    [ActivityTypes.WeightTraining, ElevateSport.WeightTraining],
    [ActivityTypes.Wheelchair, ElevateSport.Wheelchair],
    [ActivityTypes.Windsurfing, ElevateSport.Windsurf],
    [ActivityTypes.Workout, ElevateSport.Workout],
    [ActivityTypes.Yoga, ElevateSport.Yoga],
    [ActivityTypes.YogaPilates, ElevateSport.Yoga]
  ]);

  private fileConnectorConfig: FileConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(UnArchiver) public readonly unArchiver: UnArchiver,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super(appService, ipcSyncMessageSender, logger);
    this.type = ConnectorType.FILE;
    this.enabled = FileConnector.ENABLED;
  }

  public configure(fileConnectorConfig: FileConnectorConfig): this {
    super.configure(fileConnectorConfig);
    this.fileConnectorConfig = fileConnectorConfig;
    return this;
  }

  public sync(): Subject<SyncEvent> {
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.FILE));
    } else {
      // Start a new sync
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.FILE));
      this.isSyncing = true;

      this.syncFiles(this.syncEvents$).then(
        () => {
          this.isSyncing = false;
          this.syncEvents$.complete();
        },
        (syncEvent: SyncEvent) => {
          this.isSyncing = false;
          const isCancelEvent = syncEvent.type === SyncEventType.STOPPED;

          if (isCancelEvent) {
            this.syncEvents$.next(syncEvent);
          } else {
            this.logger.error(syncEvent);
            this.syncEvents$.error(syncEvent);
          }
        }
      );
    }

    return this.syncEvents$;
  }

  public syncFiles(syncEvents$: Subject<SyncEvent>): Promise<void> {
    if (!this.getFs().existsSync(this.fileConnectorConfig.info.sourceDirectory)) {
      return Promise.reject(
        ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.create(this.fileConnectorConfig.info.sourceDirectory)
      );
    }

    const afterDate = this.syncDateTime ? new Date(this.syncDateTime * 1000) : null;

    let prepareScanDirectory: Promise<void> = Promise.resolve();

    if (!afterDate && this.fileConnectorConfig.info.extractArchiveFiles) {
      const deflateNotifier$ = new Subject<string>();
      deflateNotifier$.subscribe(extractedArchivePath => {
        const extractedArchiveFileName = path.basename(extractedArchivePath);
        const evtDesc = `Activities in "${extractedArchiveFileName}" file have been extracted.`;
        syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE, evtDesc));
        this.logger.debug(evtDesc);
      });
      prepareScanDirectory = this.scanInflateActivitiesFromArchives(
        this.fileConnectorConfig.info.sourceDirectory,
        this.fileConnectorConfig.info.deleteArchivesAfterExtract,
        deflateNotifier$,
        this.fileConnectorConfig.info.scanSubDirectories
      );
    }

    return prepareScanDirectory
      .then(() => {
        syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE, "Scanning for activities..."));
        const activityFiles: ActivityFile[] = this.scanForActivities(
          this.fileConnectorConfig.info.sourceDirectory,
          afterDate,
          this.fileConnectorConfig.info.scanSubDirectories
        );
        return Promise.resolve(activityFiles);
      })
      .then(activityFiles => {
        this.logger.info("Parsing " + activityFiles.length + " activity files.");

        return activityFiles.reduce((previousPromise: Promise<void>, activityFile: ActivityFile) => {
          return previousPromise.then(() => {
            if (this.stopRequested) {
              return Promise.reject(new StoppedSyncEvent(ConnectorType.FILE));
            }

            const activityFileBuffer = this.getFs().readFileSync(activityFile.location.path);

            let parseSportsLibActivity: Promise<EventInterface> = null;

            this.logger.debug("Parsing activity file: " + activityFile.location.path);

            switch (activityFile.type) {
              case ActivityFileType.GPX:
                parseSportsLibActivity = SportsLib.importFromGPX(activityFileBuffer.toString(), xmldom.DOMParser);
                break;

              case ActivityFileType.TCX:
                const doc = new xmldom.DOMParser().parseFromString(activityFileBuffer.toString(), "application/xml");
                parseSportsLibActivity = SportsLib.importFromTCX(doc);
                break;

              case ActivityFileType.FIT:
                parseSportsLibActivity = SportsLib.importFromFit(activityFileBuffer);
                break;

              default:
                const errorMessage = `Type ${activityFile.type} not supported. Failed to parse ${activityFile.location.path}`;
                this.logger.error(errorMessage);
                return Promise.reject(errorMessage);
            }

            return parseSportsLibActivity
              .then((event: EventInterface) => {
                // Loop on all activities
                return event
                  .getActivities()
                  .reduce((previousActivityProcessed: Promise<void>, sportsLibActivity: ActivityInterface) => {
                    return previousActivityProcessed.then(() => {
                      // Is an transition activity (e.g. from swim to cycling for triathlon), then skip it
                      if (sportsLibActivity && sportsLibActivity.type === ActivityTypes.Transition) {
                        return Promise.resolve();
                      }

                      return this.findSyncedActivityModels(
                        sportsLibActivity.startDate.toISOString(),
                        sportsLibActivity.getDuration().getValue()
                      ).then((syncedActivityModels: SyncedActivityModel[]) => {
                        if (_.isEmpty(syncedActivityModels)) {
                          try {
                            // Create bare activity from "sports-lib" activity
                            const bareActivity = this.createBareActivity(sportsLibActivity);

                            let syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
                            syncedActivityModel.start_timestamp = new Date(bareActivity.start_time).getTime() / 1000;

                            // Assign reference to strava activity
                            syncedActivityModel.extras = {
                              fs_activity_location: activityFile.location
                            };

                            // Keep tracking  of activity id
                            syncedActivityModel.id =
                              Hash.apply(syncedActivityModel.start_time, Hash.SHA1, { divide: 6 }) +
                              "-" +
                              Hash.apply(syncedActivityModel.end_time, Hash.SHA1, { divide: 6 });

                            // Resolve athlete snapshot for current activity date
                            syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(
                              syncedActivityModel.start_time
                            );

                            // Extract streams
                            const streams = this.extractStreams(sportsLibActivity);

                            // Compute activity
                            syncedActivityModel.extendedStats = this.computeExtendedStats(
                              syncedActivityModel,
                              syncedActivityModel.athleteSnapshot,
                              this.fileConnectorConfig.userSettingsModel,
                              streams
                            );

                            // Compute bary center from lat/lng stream
                            syncedActivityModel.latLngCenter = BaseConnector.geoBaryCenter(streams);

                            // Try to use primitive data from computation. Else use primitive data from source (activity files) if exists
                            const primitiveSourceData = this.extractPrimitiveSourceData(sportsLibActivity);
                            syncedActivityModel = BaseConnector.updatePrimitiveStatsFromComputation(
                              syncedActivityModel as SyncedActivityModel,
                              streams,
                              primitiveSourceData
                            );

                            // Track connector type
                            syncedActivityModel.sourceConnectorType = this.type;

                            // Check if user missed some athlete settings. Goal: avoid missing stress scores because of missing settings.
                            syncedActivityModel.settingsLack = ActivityComputer.hasAthleteSettingsLacks(
                              syncedActivityModel.distance_raw,
                              syncedActivityModel.moving_time_raw,
                              syncedActivityModel.elapsed_time_raw,
                              syncedActivityModel.type,
                              syncedActivityModel.extendedStats,
                              syncedActivityModel.athleteSnapshot.athleteSettings,
                              streams
                            );

                            // Compute activity hash
                            syncedActivityModel.hash = BaseConnector.activityHash(syncedActivityModel);

                            // Deflate streams for storage
                            const deflatedStreams = streams ? Streams.deflate(streams) : null;

                            // Notify the new SyncedActivityModel
                            syncEvents$.next(
                              new ActivitySyncEvent(
                                ConnectorType.FILE,
                                null,
                                syncedActivityModel as SyncedActivityModel,
                                true,
                                deflatedStreams
                              )
                            );
                          } catch (error) {
                            this.logger.error(error);
                            const errorMessage =
                              "Unable to compute activity started '" +
                              sportsLibActivity.startDate.toISOString() +
                              "' cause: " +
                              (error.message ? error.message : error.toString());

                            const activityInError = new SyncedActivityModel();
                            activityInError.type = sportsLibActivity.type as any;
                            activityInError.start_time = sportsLibActivity.startDate.toISOString();
                            (activityInError as SyncedActivityModel).extras = {
                              fs_activity_location: activityFile.location
                            }; // Keep tracking  of activity id
                            const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                              ConnectorType.FILE,
                              errorMessage,
                              activityInError,
                              error.stack ? error.stack : null
                            );

                            return Promise.reject(errorSyncEvent);
                          }

                          return this.wait();
                        } else {
                          if (_.isArray(syncedActivityModels) && syncedActivityModels.length === 1) {
                            // One activity found

                            // Notify the new SyncedActivityModel
                            syncEvents$.next(
                              new ActivitySyncEvent(
                                ConnectorType.FILE,
                                null,
                                syncedActivityModels[0] as SyncedActivityModel,
                                false
                              )
                            );
                          } else {
                            const activitiesFound = [];
                            _.forEach(syncedActivityModels, (activityModel: SyncedActivityModel) => {
                              activitiesFound.push(
                                activityModel.name + " (" + new Date(activityModel.start_time).toString() + ")"
                              );
                            });
                            const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
                            const activityName = `${FileConnector.HumanizedDayMoment.resolve(
                              sportsLibActivity.startDate
                            )} ${elevateSportResult.type}`;

                            const errorSyncEvent = new ErrorSyncEvent(
                              ConnectorType.FILE,
                              ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
                                ConnectorType.FILE,
                                activityName,
                                sportsLibActivity.startDate,
                                activitiesFound
                              )
                            );

                            syncEvents$.next(errorSyncEvent);
                          }

                          return this.wait();
                        }
                      });
                    });
                  }, Promise.resolve());
              })
              .catch(error => {
                if ((error as EventLibError).event === null) {
                  // No event available from sports-lib
                  this.logger.warn("No sports-lib event available. Skip " + activityFile.location.path);
                  return Promise.resolve();
                }

                const errorMessage =
                  "Activity file parsing error: " + (error.message ? error.message : error.toString());
                const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                  ConnectorType.FILE,
                  errorMessage,
                  error.stack ? error.stack : null
                );

                // Keep tracking  of activity id
                errorSyncEvent.activity = new SyncedActivityModel();
                (errorSyncEvent.activity as SyncedActivityModel).extras = {
                  fs_activity_location: activityFile.location
                };

                syncEvents$.next(errorSyncEvent);
                return this.wait();
              });
          });
        }, Promise.resolve());
      });
  }

  public createBareActivity(sportsLibActivity: ActivityInterface): BareActivityModel {
    const bareActivityModel: BareActivityModel = new SyncedActivityModel() as BareActivityModel;
    bareActivityModel.id = Hash.apply(sportsLibActivity.startDate.toISOString());
    const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
    bareActivityModel.type = elevateSportResult.type;
    bareActivityModel.name = sportsLibActivity.name
      ? sportsLibActivity.name
      : FileConnector.HumanizedDayMoment.resolve(sportsLibActivity.startDate) + " " + bareActivityModel.type;

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

  public convertToElevateSport(sportsLibActivity: ActivityInterface): { type: ElevateSport; autoDetected: boolean } {
    let elevateSport = FileConnector.SPORTS_LIB_TO_ELEVATE_SPORTS_MAP.get(sportsLibActivity.type);
    if (elevateSport) {
      return { type: elevateSport, autoDetected: false };
    } else {
      if (this.fileConnectorConfig.info.detectSportTypeWhenUnknown) {
        const stats = sportsLibActivity.getStats();

        const distance = stats.get(DataDistance.type)?.getValue() as number;
        const duration = stats.get(DataDuration.type)?.getValue() as number;
        const ascent = stats.get(DataAscent.type)?.getValue() as number;
        const avgSpeed = stats.get(DataSpeedAvg.type)?.getValue() as number;
        const maxSpeed = stats.get(DataSpeedMax.type)?.getValue() as number;

        elevateSport = this.attemptDetectCommonSport(distance, duration, ascent, avgSpeed, maxSpeed);
        return { type: elevateSport, autoDetected: elevateSport !== ElevateSport.Other };
      } else {
        return { type: ElevateSport.Other, autoDetected: false };
      }
    }
  }

  public attemptDetectCommonSport(
    distance: number,
    duration: number,
    ascent: number,
    avgSpeed: number,
    maxSpeed: number
  ): ElevateSport {
    const MAX_CYCLING_SPEED_THRESHOLD = 100 / 3.6; // 100kph
    const MAX_RUNNING_SPEED_THRESHOLD = 40 / 3.6; // 40kph

    /**
     * Models the max possible running average speed to perform the given distance
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
      const perfRatio = 0.8; // Percentage of performance reachable by a well trained athlete (1 => world record);
      const y0 = 21.485097981749487;
      const a = 7.086180143945561;
      const x0 = -0.19902800428936693;
      return ((y0 + a / (meters / 1000 - x0)) / 3.6) * perfRatio;
    };

    /**
     * Detect if entry param could have been performed with or without climb assitance
     */
    const isAssisted = (pMaxSpeed: number, pDistance: number, pDuration: number, pAscent: number): boolean => {
      const criteria = Math.pow(pAscent, 2) / ((pDistance / 1000) * (pDuration / 60)) / 1000;
      return criteria >= 1;
    };

    if (maxSpeed > 0) {
      if (maxSpeed >= MAX_CYCLING_SPEED_THRESHOLD || maxSpeed >= MAX_RUNNING_SPEED_THRESHOLD) {
        return isAssisted(maxSpeed, distance, duration, ascent) ? ElevateSport.Other : ElevateSport.Ride;
      }
    }

    if (avgSpeed > 0 && distance > 0 && maxSpeed > 0) {
      const maxAvgRunningSpeed = maxAvgRunningSpeedForDistance(distance);

      const grade = (ascent / distance) * 1000;
      const gradeSpeed = avgSpeed + avgSpeed * (grade / 100) * 1.5;

      if (gradeSpeed > maxAvgRunningSpeed) {
        return isAssisted(maxSpeed, distance, duration, ascent) ? ElevateSport.Other : ElevateSport.Ride;
      } else {
        const highlightRideActivity =
          (((Math.pow(maxSpeed - avgSpeed, 3) * Math.pow(maxSpeed, 4)) / Math.pow(10, 4)) * 2) / 5;
        const decisionSecureTolerance = 0.2;

        const isRide = highlightRideActivity > 1 + decisionSecureTolerance;
        if (isRide) {
          return ElevateSport.Ride;
        }

        const isRun = highlightRideActivity < 1 - decisionSecureTolerance;
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
    const elapsedTimeRaw =
      sportsLibActivity.getDuration() && _.isNumber(sportsLibActivity.getDuration().getValue())
        ? sportsLibActivity.getDuration().getValue()
        : null;
    const pauseTime =
      sportsLibActivity.getPause() && _.isNumber(sportsLibActivity.getPause().getValue())
        ? sportsLibActivity.getPause().getValue()
        : null;

    let movingTimeRaw;
    if (_.isNumber(elapsedTimeRaw) && _.isNumber(pauseTime)) {
      movingTimeRaw = elapsedTimeRaw - pauseTime;
    } else if (_.isNumber(elapsedTimeRaw) && !_.isNumber(pauseTime)) {
      movingTimeRaw = elapsedTimeRaw;
    } else {
      movingTimeRaw = null;
    }

    const distanceRaw =
      sportsLibActivity.getDistance() && _.isNumber(sportsLibActivity.getDistance().getValue())
        ? sportsLibActivity.getDistance().getValue()
        : null;
    const elevationGainRaw =
      sportsLibActivity.getStats().get(DataAscent.type) &&
      _.isNumber(sportsLibActivity.getStats().get(DataAscent.type).getValue())
        ? (sportsLibActivity.getStats().get(DataAscent.type).getValue() as number)
        : null;
    return new PrimitiveSourceData(elapsedTimeRaw, movingTimeRaw, distanceRaw, elevationGainRaw);
  }

  public extractStreams(sportsLibActivity: ActivityInterface): Streams {
    const streams: Streams = new Streams();

    // Time via distance stream
    try {
      streams.time = sportsLibActivity.generateTimeStream([DataDistance.type]).getData(true, true);
    } catch (err) {
      this.logger.info("No distance stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Lat long
    try {
      const longitudes = sportsLibActivity.getSquashedStreamData(DataLongitudeDegrees.type);
      const latitudes = sportsLibActivity.getSquashedStreamData(DataLatitudeDegrees.type);
      streams.latlng = latitudes.map((latitude, index) => {
        return [_.floor(latitude, 8), _.floor(longitudes[index], 8)];
      });
    } catch (err) {
      this.logger.info("No lat or lon streams found for activity starting at " + sportsLibActivity.startDate);
    }

    // Distance
    try {
      streams.distance = sportsLibActivity.getSquashedStreamData(DataDistance.type);
    } catch (err) {
      this.logger.info("No distance stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Speed
    try {
      streams.velocity_smooth = sportsLibActivity.getSquashedStreamData(DataSpeed.type);
    } catch (err) {
      this.logger.info("No speed stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // HeartRate
    try {
      streams.heartrate = sportsLibActivity.getSquashedStreamData(DataHeartRate.type);
    } catch (err) {
      this.logger.info("No heartrate stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Altitude
    try {
      streams.altitude = sportsLibActivity.getSquashedStreamData(DataAltitude.type);
    } catch (err) {
      this.logger.info("No altitude stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Cadence
    try {
      streams.cadence = sportsLibActivity.getSquashedStreamData(DataCadence.type);
    } catch (err) {
      this.logger.info("No cadence stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Watts
    try {
      if (sportsLibActivity.hasPowerMeter()) {
        streams.watts = sportsLibActivity.getSquashedStreamData(DataPower.type);
      }
    } catch (err) {
      this.logger.info("No power stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Grade
    try {
      streams.grade_smooth = sportsLibActivity.getSquashedStreamData(DataGrade.type);
    } catch (err) {
      this.logger.info("No grade stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Grade adjusted speed
    try {
      if (ActivityTypesHelper.getActivityGroupForActivityType(sportsLibActivity.type) === ActivityTypeGroups.Running) {
        streams.grade_adjusted_speed = sportsLibActivity.getSquashedStreamData(DataGradeAdjustedSpeed.type);
      }
    } catch (err) {
      this.logger.info("No grade adjusted speed stream found for activity starting at " + sportsLibActivity.startDate);
    }

    try {
      streams.temp = sportsLibActivity.getSquashedStreamData(DataTemperature.type);
    } catch (err) {
      this.logger.info("No temperature stream found for activity starting at " + sportsLibActivity.startDate);
    }

    return streams;
  }

  public scanForActivities(
    directory: string,
    afterDate: Date = null,
    recursive: boolean = false,
    pathsList = []
  ): ActivityFile[] {
    const files = this.getFs().readdirSync(directory);

    const trackFile = (absolutePath: string, type: ActivityFileType, lastModificationDate: Date): void => {
      pathsList.push(new ActivityFile(type, absolutePath, lastModificationDate));
    };

    files.forEach(file => {
      const isDirectory = this.getFs().statSync(`${directory}/${file}`, { bigint: true }).isDirectory();

      if (recursive && isDirectory) {
        pathsList.push(this.scanForActivities(directory + "/" + file, afterDate, recursive, []));
      }

      if (!isDirectory) {
        const fileExtension = path.extname(file).slice(1) as ActivityFileType;
        if (
          fileExtension === ActivityFileType.GPX ||
          fileExtension === ActivityFileType.TCX ||
          fileExtension === ActivityFileType.FIT
        ) {
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

    return recursive ? _.flatten(pathsList) : pathsList;
  }

  public getLastAccessDate(absolutePath: string): Date {
    const stats = this.getFs().statSync(absolutePath, { bigint: true });
    return stats.mtime > stats.birthtime ? stats.mtime : stats.birthtime;
  }

  public deflateActivitiesFromArchive(archiveFilePath: string, deleteArchive: boolean = false): Promise<string[]> {
    const fileName = path.basename(archiveFilePath);
    const currentArchiveDir = path.dirname(archiveFilePath);
    const archiveFileNameFingerPrint = Hash.apply(fileName, Hash.SHA1, { divide: 6 });
    const extractDir = currentArchiveDir + "/" + archiveFileNameFingerPrint;

    // Create extract directory
    if (this.getFs().existsSync(extractDir)) {
      this.getFs().rmdirSync(extractDir, { recursive: true });
    }
    this.getFs().mkdirSync(extractDir, { recursive: true });

    return this.unArchiver
      .unpack(archiveFilePath, extractDir)
      .then(() => {
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
            const newActivityPath =
              currentArchiveDir +
              "/" +
              archiveFileNameFingerPrint +
              (relativeExtractedDirName ? "-" + Hash.apply(relativeExtractedDirName, Hash.SHA1, { divide: 6 }) : "") +
              "-" +
              extractedFileName;
            this.getFs().renameSync(extractedActivityFile.location.path, newActivityPath);
            trackedNewPaths.push(newActivityPath);
          });

          // Remove extract directory
          this.getFs().rmdirSync(extractDir, { recursive: true });

          if (deleteArchive) {
            this.getFs().unlinkSync(archiveFilePath);
          }

          return Promise.resolve(trackedNewPaths);
        } catch (err) {
          this.getFs().rmdirSync(extractDir, { recursive: true });
          return Promise.reject(err);
        }
      })
      .catch(err => {
        this.getFs().rmdirSync(extractDir, { recursive: true });
        return Promise.reject(err);
      });
  }

  /**
   *
   * @return Promise of archive paths being deflated.
   */
  public scanInflateActivitiesFromArchives(
    sourceDir: string,
    deleteArchives: boolean,
    deflateNotifier: Subject<string> = new Subject<string>(),
    recursive: boolean = false
  ): Promise<void> {
    const files = this.getFs().readdirSync(sourceDir);

    return files
      .reduce((previousPromise: Promise<void>, file: string) => {
        return previousPromise.then(() => {
          const isDirectory = this.getFs()
            .statSync(sourceDir + "/" + file, { bigint: true })
            .isDirectory();

          if (recursive && isDirectory) {
            return this.scanInflateActivitiesFromArchives(
              sourceDir + "/" + file,
              deleteArchives,
              deflateNotifier,
              recursive
            );
          }

          if (!isDirectory) {
            const absolutePath = path.join(sourceDir, file);
            if (UnArchiver.isArchiveFile(file)) {
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
      }, Promise.resolve())
      .then(() => {
        if (deflateNotifier) {
          deflateNotifier.complete();
        }
        return Promise.resolve();
      });
  }

  public wait(): Promise<void> {
    return sleep(FileConnector.SLEEP_TIME_BETWEEN_FILE_PARSED);
  }

  public getFs(): typeof fs {
    return fs;
  }
}
