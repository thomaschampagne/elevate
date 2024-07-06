import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { AppService } from "../../app-service";
import { ActivityTypes } from "@thomaschampagne/sports-lib/lib/activities/activity.types";
import { DataSpeed } from "@thomaschampagne/sports-lib/lib/data/data.speed";
import { DataAscent } from "@thomaschampagne/sports-lib/lib/data/data.ascent";
import { DataAltitude } from "@thomaschampagne/sports-lib/lib/data/data.altitude";
import { DataDistance } from "@thomaschampagne/sports-lib/lib/data/data.distance";
import { DataSpeedAvg } from "@thomaschampagne/sports-lib/lib/data/data.speed-avg";
import { DataHeartRate } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate";
import { DataPower } from "@thomaschampagne/sports-lib/lib/data/data.power";
import { DataDuration } from "@thomaschampagne/sports-lib/lib/data/data.duration";
import { DataSpeedMax } from "@thomaschampagne/sports-lib/lib/data/data.speed-max";
import { DataCadence } from "@thomaschampagne/sports-lib/lib/data/data.cadence";
import { FileConnectorConfig } from "../connector-config.model";
import { inject, singleton } from "tsyringe";
import { Hash } from "../../tools/hash";
import { UnArchiver } from "./un-archiver";
import { DataTemperature } from "@thomaschampagne/sports-lib/lib/data/data.temperature";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import { DataEnergy } from "@thomaschampagne/sports-lib/lib/data/data.energy";
import { DataPaceAvg } from "@thomaschampagne/sports-lib/lib/data/data.pace-avg";
import { DataDescent } from "@thomaschampagne/sports-lib/lib/data/data.descent";
import { DataCadenceAvg } from "@thomaschampagne/sports-lib/lib/data/data.cadence-avg";
import { DataHeartRateAvg } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate-avg";
import { DataHeartRateMax } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate-max";
import { DataActiveLap } from "@thomaschampagne/sports-lib/lib/data/data-active-lap";
import { DataPowerAvg } from "@thomaschampagne/sports-lib/lib/data/data.power-avg";
import moment from "moment";
import { DataSWOLF25m } from "@thomaschampagne/sports-lib/lib/data/data.swolf-25m";
import { DataSWOLF50m } from "@thomaschampagne/sports-lib/lib/data/data.swolf-50m";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { DataTime } from "@thomaschampagne/sports-lib/lib/data/data.time";
import { LapJSONInterface } from "@thomaschampagne/sports-lib/lib/laps/lap.json.interface";
import { DataMovingTime } from "@thomaschampagne/sports-lib/lib/data/data.moving-time";
import { DataPause } from "@thomaschampagne/sports-lib/lib/data/data.pause";
import { EventJSONInterface } from "@thomaschampagne/sports-lib/lib/events/event.json.interface";
import { ActivityFile } from "./activity-file.model";
import { WorkerService } from "../../worker-service";
import { SportsLibWorkerParams } from "../../workers/sports-lib.worker";
import { DataPosition } from "@thomaschampagne/sports-lib/lib/data/data.position";
import { Movement } from "@elevate/shared/tools/movement";
import { sleep } from "@elevate/shared/tools/sleep";
import { extension } from "@elevate/shared/tools/extension";
import { basename } from "@elevate/shared/tools/basename";
import { WorkerType } from "../../enum/worker-type.enum";
import { DataPowerWork } from "@thomaschampagne/sports-lib/lib/data/data.power-work";
import { DataCyclingStandingTime } from "@thomaschampagne/sports-lib/lib/data/data.cycling-standing-time";
import { DataRightBalance } from "@thomaschampagne/sports-lib/lib/data/data.right-balance";
import { DataPowerTorqueEffectivenessLeft } from "@thomaschampagne/sports-lib/lib/data/data.power-torque-effectiveness-left";
import { DataCyclingSeatedTime } from "@thomaschampagne/sports-lib/lib/data/data.cycling-seated-time";
import { DataLeftBalance } from "@thomaschampagne/sports-lib/lib/data/data.left-balance";
import { DataPowerPedalSmoothnessRight } from "@thomaschampagne/sports-lib/lib/data/data.power-pedal-smoothness-right";
import { DataPowerPedalSmoothnessLeft } from "@thomaschampagne/sports-lib/lib/data/data.power-pedal-smoothness-left";
import { DataPowerTorqueEffectivenessRight } from "@thomaschampagne/sports-lib/lib/data/data.power-torque-effectiveness-right";
import { DataStanceTimeBalanceLeft } from "@thomaschampagne/sports-lib/lib/data/data-stance-time-balance-left";
import { DataStanceTimeBalanceRight } from "@thomaschampagne/sports-lib/lib/data/data-stance-time-balance-right";
import { DataStanceTime } from "@thomaschampagne/sports-lib/lib/data/data.stance-time";
import { DataVerticalOscillation } from "@thomaschampagne/sports-lib/lib/data/data.vertical-oscillation";
import { DataVerticalRatio } from "@thomaschampagne/sports-lib/lib/data/data.vertical-ratio";
import { DataAvgStrideLength } from "@thomaschampagne/sports-lib/lib/data/data.avg-stride-length";
import { HttpClient } from "../../clients/http.client";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { DataAerobicTrainingEffect } from "@thomaschampagne/sports-lib/lib/data/data-aerobic-training-effect";
import { DataAnaerobicTrainingEffect } from "@thomaschampagne/sports-lib/lib/data/data-anaerobic-training-effect";
import { CreatorJSONInterface } from "@thomaschampagne/sports-lib/lib/creators/creator.json.interface";
import { EmptyEventLibError } from "@thomaschampagne/sports-lib/lib/errors/empty-event-sports-libs.error";
import { DurationExceededEventLibError } from "@thomaschampagne/sports-lib/lib/errors/duration-exceeded-event-lib.error";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import {
  Activity,
  ActivityExtras,
  ActivityStats,
  CyclingDynamicsStats,
  ElevationStats,
  Lap,
  PaceStats,
  PowerStats,
  RunningDynamicsStats,
  Scores,
  SpeedStats,
  StressScores,
  TrainingEffect
} from "@elevate/shared/models/sync/activity.model";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";
import { DataGradeAdjustedPaceAvg } from "@thomaschampagne/sports-lib/lib/data/data.grade-adjusted-pace-avg";

@singleton()
export class FileConnector extends BaseConnector {
  private static readonly SLEEP_TIME_BETWEEN_FILE_PARSED: number = 5;
  private static readonly SKIP_FOLDERS_REGEX: RegExp = /__macosx|\$recycle.bin|\.trash/gi;

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

  private readonly unknownDevicesReasonsIds: string[];

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(UnArchiver) public readonly unArchiver: UnArchiver,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.FILE;
    this.enabled = FileConnector.ENABLED;
    this.unknownDevicesReasonsIds = [];
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

      this.logger.info(`Starting new sync on '${this.type}' connector`);

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
            this.syncEvents$.next(new StoppedSyncEvent(this.type));
            this.syncEvents$.error(syncEvent);
            this.logger.error(syncEvent);
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

    const afterDate = this.syncFromDateTime ? new Date(this.syncFromDateTime) : null;

    let prepareScanDirectory: Promise<void> = Promise.resolve();

    if (!afterDate && this.fileConnectorConfig.info.extractArchiveFiles) {
      const inflateNotifier$ = new Subject<string>();
      inflateNotifier$.subscribe(extractedArchivePath => {
        const extractedArchiveFileName = path.basename(extractedArchivePath);
        const evtDesc = `Activities in "${extractedArchiveFileName}" file have been extracted.`;
        syncEvents$.next(new GenericSyncEvent(ConnectorType.FILE, evtDesc));
        this.logger.debug(evtDesc);
      });
      prepareScanDirectory = this.scanInflateActivitiesFromArchives(
        this.fileConnectorConfig.info.sourceDirectory,
        this.fileConnectorConfig.info.deleteArchivesAfterExtract,
        inflateNotifier$,
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
        this.logger.info(`Parsing ${activityFiles.length} activity files.`);

        return activityFiles.reduce((previousPromise: Promise<void>, activityFile: ActivityFile) => {
          return previousPromise.then(() => {
            if (this.stopRequested) {
              return Promise.reject(new StoppedSyncEvent(ConnectorType.FILE));
            }

            this.logger.debug(`Computing file "${activityFile.location.path}"`);

            return this.computeSportsLibEvent(activityFile)
              .then((result: { event: EventJSONInterface; logsInfo: string[] }) => {
                // Print sports-libs compute logs info
                result.logsInfo.forEach(log => this.logger.info(log));

                // Loop on all activities
                return result.event.activities.reduce(
                  (previousActivityProcessed: Promise<void>, sportsLibActivity: ActivityJSONInterface) => {
                    return previousActivityProcessed.then(() => {
                      // Is a transition activity (e.g. from swim to cycling for triathlon), then skip it
                      if (sportsLibActivity && sportsLibActivity.type === ActivityTypes.Transition) {
                        return Promise.resolve();
                      }

                      const startDate = new Date(sportsLibActivity.startDate);
                      const endDate = new Date(sportsLibActivity.endDate);

                      return this.findLocalActivities(startDate.toISOString(), endDate.toISOString()).then(
                        (localActivities: Activity[]) => {
                          if (_.isEmpty(localActivities) || this.environment.allowActivitiesOverLapping) {
                            // Create bare activity from "sports-lib" activity
                            let activity: Partial<Activity> = this.createBareActivity(sportsLibActivity);

                            // Extract streams
                            const streams = this.mapStreams(sportsLibActivity);

                            // Set common activity properties
                            activity = this.assignBaseProperties(activity, streams);

                            // Assign reference to strava activity
                            activity.extras = {
                              file: {
                                path: activityFile.location.path,
                                type: extension(activityFile.location.path) as ActivityFileType
                              }
                            } as ActivityExtras;

                            // Resolve athlete snapshot for current activity date
                            const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);

                            // Fetch source stats coming from files.
                            // These stats will override the computed stats to display what the user had seen on his device
                            activity.srcStats = this.getSourceStats(activity.type, sportsLibActivity, streams);

                            // Process laps
                            activity.laps = this.processLaps(activity.type, sportsLibActivity.laps);

                            // Fetch device name if exists
                            activity.device = this.fetchAndHandleDeviceName(activityFile, sportsLibActivity.creator);

                            // Set comment to null at the moment
                            activity.notes = null;

                            // Compute activity
                            return this.computeActivity(
                              activity,
                              athleteSnapshot,
                              this.fileConnectorConfig.userSettings,
                              streams,
                              true
                            )
                              .then(results => {
                                const { computedActivity, deflatedStreams } = results;

                                // Rename activity files to Sport_YYYY-MM-DD_HH-mm-ss.extension if requested by user
                                if (this.fileConnectorConfig.info.renameActivityFiles) {
                                  this.renameProcessedFile(
                                    result.event.activities.length,
                                    activityFile,
                                    activity,
                                    computedActivity
                                  );
                                }

                                // Notify the new Activity
                                syncEvents$.next(
                                  new ActivitySyncEvent(
                                    ConnectorType.FILE,
                                    null,
                                    computedActivity,
                                    true,
                                    deflatedStreams
                                  )
                                );

                                return this.wait();
                              })
                              .catch(error => {
                                this.logger.error(error);

                                const errorMessage = `Unable to compute activity file "${basename(
                                  activityFile.location.path
                                )}"`;

                                const activityInError = new Activity();
                                activityInError.type = sportsLibActivity.type as any;
                                activityInError.startTime = startDate.toISOString();
                                (activityInError as Activity).extras = {
                                  file: {
                                    path: activityFile.location.path,
                                    type: extension(activityFile.location.path) as ActivityFileType
                                  }
                                } as ActivityExtras; // Keep tracking  of activity id
                                const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                                  ConnectorType.FILE,
                                  errorMessage,
                                  activityInError,
                                  error
                                );

                                return Promise.reject(errorSyncEvent);
                              });
                          } else {
                            if (_.isArray(localActivities) && localActivities.length === 1) {
                              // One activity found
                              // Notify the existing Activity
                              syncEvents$.next(
                                new ActivitySyncEvent(ConnectorType.FILE, null, localActivities[0], false)
                              );
                            } else {
                              const activitiesFound = [];
                              _.forEach(localActivities, (activity: Activity) => {
                                activitiesFound.push(
                                  `<${activity.name} from ${moment(activity.startTime).format("LLL")} to ${moment(
                                    activity.endTime
                                  ).format("LLL")}>`
                                );
                              });
                              const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
                              const activityName = `${FileConnector.HumanizedDayMoment.resolve(startDate)} ${
                                elevateSportResult.type
                              }`;

                              const errorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
                                ConnectorType.FILE,
                                activityName,
                                startDate,
                                endDate,
                                activitiesFound
                              );

                              syncEvents$.next(errorSyncEvent);
                            }

                            return this.wait();
                          }
                        }
                      );
                    });
                  },
                  Promise.resolve()
                );
              })
              .catch(error => {
                this.logger.error(error);

                if (error.type === SyncEventType.ERROR) {
                  syncEvents$.next(error);
                } else if (error instanceof Error) {
                  // Keep tracking  of activity id
                  const activity = new Activity();
                  activity.extras = {
                    file: {
                      path: activityFile.location.path,
                      type: extension(activityFile.location.path) as ActivityFileType
                    }
                  } as ActivityExtras;

                  const errorMessage = `Issue on activity file ${basename(activityFile.location.path)}`;

                  const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                    ConnectorType.FILE,
                    errorMessage,
                    activity,
                    error
                  );

                  syncEvents$.next(errorSyncEvent);
                } else {
                  syncEvents$.next(
                    ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.FILE, error.message || error)
                  );
                }

                return this.wait();
              });
          });
        }, Promise.resolve());
      });
  }

  /**
   * Rename file option while discovering activities
   */
  private renameProcessedFile(
    activityEventCount: number,
    activityFile: ActivityFile,
    activity: Partial<Activity>,
    computedActivity: Activity
  ): void {
    // Rename file if option is enabled and only 1 activity exists in current event
    if (activityEventCount === 1) {
      // Rebuild new name
      const dirname = path.dirname(activityFile.location.path);
      const ext = path.extname(activityFile.location.path);

      // Track old path
      const oldPath = path.normalize(computedActivity.extras.file.path);

      // Build new path
      const newPath = path.normalize(
        `${dirname}/${activity.type}_${moment(activity.startTime).format("YYYY-MM-DD_HH-mm-ss")}${ext}`
      );

      // Rename file
      if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
        // Rename file
        fs.renameSync(oldPath, newPath);

        // Update link to activity
        computedActivity.extras.file.path = newPath;
      }
    }
  }

  public computeSportsLibEvent(activityFile: ActivityFile): Promise<{
    event: EventJSONInterface;
    logsInfo: string[];
  }> {
    return this.workerService.exec<SportsLibWorkerParams, { event: EventJSONInterface; logsInfo: string[] }>(
      WorkerType.SPORTS_LIB,
      { path: activityFile.location.path }
    );
  }

  private processLaps(sport: ElevateSport, sportsLibLaps: LapJSONInterface[]): Lap[] {
    if (!sportsLibLaps || sportsLibLaps.length <= 1) {
      return null;
    }

    return sportsLibLaps.map((lapObj: LapJSONInterface) => {
      const lap: Lap = {
        id: lapObj.lapId,
        active:
          lapObj.stats[DataActiveLap.type] || lapObj.stats[DataActiveLap.type] === false
            ? !!lapObj.stats[DataActiveLap.type]
            : null,
        indexes: [lapObj.startIndex, lapObj.endIndex]
      };

      if (Number.isFinite(lapObj.stats[DataDistance.type])) {
        lap.distance = lapObj.stats[DataDistance.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataAscent.type])) {
        lap.elevationGain = lapObj.stats[DataAscent.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataDuration.type])) {
        lap.elapsedTime = lapObj.stats[DataDuration.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataMovingTime.type])) {
        lap.movingTime = lapObj.stats[DataMovingTime.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataSpeedAvg.type])) {
        lap.avgSpeed = _.round((lapObj.stats[DataSpeedAvg.type] as number) * Constant.MPS_KPH_FACTOR, 3);
        lap.avgPace = _.round(Movement.speedToPace(lap.avgSpeed));
      }

      if (Number.isFinite(lapObj.stats[DataSpeedMax.type])) {
        lap.maxSpeed = _.round((lapObj.stats[DataSpeedMax.type] as number) * Constant.MPS_KPH_FACTOR, 3);
        lap.maxPace = _.round(Movement.speedToPace(lap.maxSpeed));
      }

      if (Number.isFinite(lapObj.stats[DataCadenceAvg.type])) {
        lap.avgCadence = lapObj.stats[DataCadenceAvg.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataHeartRateAvg.type])) {
        lap.avgHr = lapObj.stats[DataHeartRateAvg.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataHeartRateMax.type])) {
        lap.maxHr = lapObj.stats[DataHeartRateMax.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataPowerAvg.type])) {
        lap.avgWatts = lapObj.stats[DataPowerAvg.type] as number;
      }

      if (Number.isFinite(lapObj.stats[DataEnergy.type])) {
        lap.calories = lapObj.stats[DataEnergy.type] as number;
      }

      if (lap.active && Activity.isSwim(sport)) {
        if (lapObj.stats[DataSWOLF25m.type]) {
          lap.swolf25m = lapObj.stats[DataSWOLF25m.type] as number;
        } else if (lap.avgSpeed && lap.avgCadence) {
          lap.swolf25m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 25);
        }

        if (lapObj.stats[DataSWOLF50m.type]) {
          lap.swolf50m = lapObj.stats[DataSWOLF50m.type] as number;
        } else if (lap.avgSpeed && lap.avgCadence) {
          lap.swolf50m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 50);
        }
      }

      return lap;
    });
  }

  public createBareActivity(sportsLibActivity: ActivityJSONInterface): BareActivity {
    const startTimestamp = Math.floor(sportsLibActivity.startDate / 1000);
    const endTimestamp = Math.floor(sportsLibActivity.endDate / 1000);

    const startDate = new Date(sportsLibActivity.startDate);
    const endDate = new Date(sportsLibActivity.endDate);

    const bareActivity: BareActivity = new Activity() as BareActivity;
    const elevateSportResult = this.convertToElevateSport(sportsLibActivity);
    bareActivity.type = elevateSportResult.type;
    bareActivity.name = sportsLibActivity.name
      ? sportsLibActivity.name
      : FileConnector.HumanizedDayMoment.resolve(startDate) + " " + bareActivity.type;

    if (elevateSportResult.autoDetected) {
      bareActivity.name += " #detected";
    }

    bareActivity.startTime = startDate.toISOString();
    bareActivity.endTime = endDate.toISOString();
    bareActivity.startTimestamp = startTimestamp;
    bareActivity.endTimestamp = endTimestamp;

    bareActivity.hasPowerMeter = sportsLibActivity.powerMeter;
    bareActivity.trainer = sportsLibActivity.trainer;
    bareActivity.commute = null; // Unsupported at the moment
    bareActivity.manual = false; // Should be false when file
    return bareActivity;
  }

  public getSourceStats(
    sport: ElevateSport,
    source: Partial<ActivityJSONInterface>,
    streams: Streams
  ): Partial<ActivityStats> {
    const getCommonStats = () => {
      // Timings
      srcStats.movingTime = (source.stats[DataMovingTime.type] as number) || null;
      srcStats.elapsedTime = (source.stats[DataDuration.type] as number) || null;
      srcStats.pauseTime = (source.stats[DataPause.type] as number) || null;
      srcStats.moveRatio =
        srcStats.movingTime && srcStats.elapsedTime
          ? _.round(srcStats.movingTime / srcStats.elapsedTime, ActivityComputer.RND)
          : null;

      // Distance
      if (Number.isFinite(source.stats[DataDistance.type])) {
        srcStats.distance = _.round(source.stats[DataDistance.type] as number, ActivityComputer.RND);
      }

      // Calories if available
      if (Number.isFinite(source.stats[DataEnergy.type])) {
        srcStats.calories = source.stats[DataEnergy.type] as number;
        srcStats.caloriesPerHour =
          srcStats.calories > 0 && srcStats.elapsedTime > 0
            ? _.round((srcStats.calories / srcStats.elapsedTime) * Constant.SEC_HOUR_FACTOR, ActivityComputer.RND)
            : null;
      }
    };

    const getElevationGainLoss = () => {
      if (Number.isFinite(source.stats[DataAscent.type])) {
        srcStats.elevation.ascent = _.round(source.stats[DataAscent.type] as number);
        srcStats.elevationGain = srcStats.elevation.ascent;
      }

      if (Number.isFinite(source.stats[DataDescent.type])) {
        srcStats.elevation.descent = _.round(source.stats[DataDescent.type] as number);
      }
    };

    // Get all average velocities: we cannot get only avg speed for instance, we need also grade adjusted speed
    // for the same computation model
    const getAvgVelocities = () => {
      if (Number.isFinite(source.stats[DataSpeedAvg.type])) {
        srcStats.speed.avg = _.round(
          (source.stats[DataSpeedAvg.type] as number) * Constant.MPS_KPH_FACTOR,
          ActivityComputer.RND
        );
      }

      if (Number.isFinite(source.stats[DataPaceAvg.type])) {
        srcStats.pace.avg = _.round(source.stats[DataPaceAvg.type] as number, ActivityComputer.RND);
      }

      if (Number.isFinite(source.stats[DataGradeAdjustedPaceAvg.type])) {
        srcStats.pace.gapAvg = _.round(source.stats[DataGradeAdjustedPaceAvg.type] as number, ActivityComputer.RND);
      }
    };

    const getPowerRelatedStats = () => {
      if (Number.isFinite(source.stats[DataPowerWork.type])) {
        srcStats.power = {} as PowerStats;
        srcStats.power.work = source.stats[DataPowerWork.type] as number;
      }
    };

    const getPowerBasedCyclingDynamicsStats = () => {
      srcStats.dynamics = {
        cycling: {
          balance: {},
          torqueEffectiveness: {},
          pedalSmoothness: {}
        } as CyclingDynamicsStats
      };

      if (Number.isFinite(source.stats[DataCyclingStandingTime.type])) {
        srcStats.dynamics.cycling.standingTime = source.stats[DataCyclingStandingTime.type] as number;
      }

      if (Number.isFinite(source.stats[DataCyclingSeatedTime.type])) {
        srcStats.dynamics.cycling.seatedTime = source.stats[DataCyclingSeatedTime.type] as number;
      }

      if (Number.isFinite(source.stats[DataLeftBalance.type])) {
        srcStats.dynamics.cycling.balance.left = source.stats[DataLeftBalance.type] as number;
      }

      if (Number.isFinite(source.stats[DataRightBalance.type])) {
        srcStats.dynamics.cycling.balance.right = source.stats[DataRightBalance.type] as number;
      }

      if (Number.isFinite(source.stats[DataPowerTorqueEffectivenessLeft.type])) {
        srcStats.dynamics.cycling.torqueEffectiveness.left = source.stats[
          DataPowerTorqueEffectivenessLeft.type
        ] as number;
      }

      if (Number.isFinite(source.stats[DataPowerTorqueEffectivenessRight.type])) {
        srcStats.dynamics.cycling.torqueEffectiveness.right = source.stats[
          DataPowerTorqueEffectivenessRight.type
        ] as number;
      }

      if (Number.isFinite(source.stats[DataPowerPedalSmoothnessLeft.type])) {
        srcStats.dynamics.cycling.pedalSmoothness.left = source.stats[DataPowerPedalSmoothnessLeft.type] as number;
      }

      if (Number.isFinite(source.stats[DataPowerPedalSmoothnessRight.type])) {
        srcStats.dynamics.cycling.pedalSmoothness.right = source.stats[DataPowerPedalSmoothnessRight.type] as number;
      }
    };

    const getPowerBasedRunningDynamicsStats = () => {
      srcStats.dynamics = {
        running: {
          stanceTimeBalance: {}
        } as RunningDynamicsStats
      };

      if (Number.isFinite(source.stats[DataStanceTimeBalanceLeft.type])) {
        srcStats.dynamics.running.stanceTimeBalance.left = source.stats[DataStanceTimeBalanceLeft.type] as number;
      }

      if (Number.isFinite(source.stats[DataStanceTimeBalanceRight.type])) {
        srcStats.dynamics.running.stanceTimeBalance.right = source.stats[DataStanceTimeBalanceRight.type] as number;
      }
      if (Number.isFinite(source.stats[DataStanceTime.type])) {
        srcStats.dynamics.running.stanceTime = source.stats[DataStanceTime.type] as number;
      }

      if (Number.isFinite(source.stats[DataVerticalOscillation.type])) {
        srcStats.dynamics.running.verticalOscillation = _.round(
          (source.stats[DataVerticalOscillation.type] as number) / 1000, // millimeters to meters
          4
        );
      }

      if (Number.isFinite(source.stats[DataVerticalRatio.type])) {
        srcStats.dynamics.running.verticalRatio = source.stats[DataVerticalRatio.type] as number;
      }

      if (Number.isFinite(source.stats[DataAvgStrideLength.type])) {
        srcStats.dynamics.running.avgStrideLength = source.stats[DataAvgStrideLength.type] as number;
      }
    };

    const getSwimmingStats = () => {
      // Get Swim SWOLF when swim activity and available
      if (source.stats[DataSWOLF25m.type] || source.stats[DataSWOLF50m.type]) {
        if (!srcStats.scores) {
          srcStats.scores = {} as Scores;
        }

        if (!srcStats.scores.swolf) {
          srcStats.scores.swolf = {};
        }

        if (source.stats[DataSWOLF25m.type]) {
          srcStats.scores.swolf["25"] = source.stats[DataSWOLF25m.type] as number;
        } else {
          // Try to compute if unavailable
          if (srcStats?.speed?.avg && source.stats[DataCadenceAvg.type]) {
            srcStats.scores.swolf["25"] = ActivityComputer.computeSwimSwolf(
              Movement.speedToSwimPace(srcStats.speed.avg),
              source.stats[DataCadenceAvg.type] as number,
              25
            );
          }
        }

        if (source.stats[DataSWOLF50m.type]) {
          srcStats.scores.swolf["50"] = source.stats[DataSWOLF50m.type] as number;
        } else {
          // Try to compute if unavailable
          if (srcStats?.speed?.avg && source.stats[DataCadenceAvg.type]) {
            srcStats.scores.swolf["50"] = ActivityComputer.computeSwimSwolf(
              Movement.speedToSwimPace(srcStats.speed.avg),
              source.stats[DataCadenceAvg.type] as number,
              50
            );
          }
        }
      }
    };

    const getTrainingEffectStats = () => {
      if (
        Number.isFinite(source.stats[DataAerobicTrainingEffect.type]) ||
        Number.isFinite(source.stats[DataAnaerobicTrainingEffect.type])
      ) {
        if (!srcStats.scores) {
          srcStats.scores = {} as Scores;
        }

        if (!srcStats.scores.stress) {
          srcStats.scores.stress = {} as StressScores;
        }

        if (!srcStats.scores.stress.trainingEffect) {
          srcStats.scores.stress.trainingEffect = {} as TrainingEffect;
        }

        if (Number.isFinite(source.stats[DataAerobicTrainingEffect.type])) {
          srcStats.scores.stress.trainingEffect.aerobic = source.stats[DataAerobicTrainingEffect.type] as number;
        }

        if (Number.isFinite(source.stats[DataAnaerobicTrainingEffect.type])) {
          srcStats.scores.stress.trainingEffect.anaerobic = source.stats[DataAnaerobicTrainingEffect.type] as number;
        }
      }
    };

    const srcStats: Partial<ActivityStats> = {
      speed: {} as SpeedStats,
      pace: {} as PaceStats,
      elevation: {} as ElevationStats
    };

    // Fetch common stats such as tie based stats, distance, calories..
    getCommonStats();

    // Elevation Gain Loss
    getElevationGainLoss();

    // Avg Speed & ( Pace & Grade adjusted pace )
    getAvgVelocities();

    // Power related data provided by files directly
    getPowerRelatedStats();

    // Get Power Based Cycling Dynamics if cycling activity with power meter
    if (Activity.isRide(sport) && source.powerMeter) {
      getPowerBasedCyclingDynamicsStats();
    }

    // Get Power Based Running Dynamics if running activity with power meter
    if (Activity.isRun(sport) && source.powerMeter) {
      getPowerBasedRunningDynamicsStats();
    }

    // Get Swim stats if swim activity
    if (Activity.isSwim(sport)) {
      getSwimmingStats();
    }

    getTrainingEffectStats();

    return srcStats;
  }

  public convertToElevateSport(sportsLibActivity: ActivityJSONInterface): {
    type: ElevateSport;
    autoDetected: boolean;
  } {
    const elevateSport = FileConnector.SPORTS_LIB_TO_ELEVATE_SPORTS_MAP.get(sportsLibActivity.type);
    if (elevateSport) {
      return { type: elevateSport, autoDetected: false };
    } else {
      return { type: ElevateSport.Other, autoDetected: false };
    }
  }

  public mapStreams(sportsLibActivity: ActivityJSONInterface): Streams {
    const streams: Streams = new Streams();

    // Time
    if (sportsLibActivity.streams[DataTime.type]) {
      streams.time = sportsLibActivity.streams[DataTime.type];
    }

    // Lat long
    if (sportsLibActivity.streams[DataPosition.type]) {
      streams.latlng = sportsLibActivity.streams[DataPosition.type];
    }

    // Distance
    if (sportsLibActivity.streams[DataDistance.type]) {
      streams.distance = sportsLibActivity.streams[DataDistance.type];
    }

    // Speed
    if (sportsLibActivity.streams[DataSpeed.type]) {
      streams.velocity_smooth = sportsLibActivity.streams[DataSpeed.type];
    }

    // HeartRate
    if (sportsLibActivity.streams[DataHeartRate.type]) {
      streams.heartrate = sportsLibActivity.streams[DataHeartRate.type];
    }

    // Altitude
    if (sportsLibActivity.streams[DataAltitude.type]) {
      streams.altitude = sportsLibActivity.streams[DataAltitude.type];
    }

    // Cadence
    if (sportsLibActivity.streams[DataCadence.type]) {
      streams.cadence = sportsLibActivity.streams[DataCadence.type];
    }

    // Watts
    if (sportsLibActivity.streams[DataPower.type]) {
      streams.watts = sportsLibActivity.streams[DataPower.type];
    }

    // Temperature
    if (sportsLibActivity.streams[DataTemperature.type]) {
      streams.temp = sportsLibActivity.streams[DataTemperature.type];
    }

    return streams;
  }

  public scanForActivities(
    directory: string,
    afterDate: Date = null,
    recursive = false,
    pathsList = []
  ): ActivityFile[] {
    const files = this.getFs().readdirSync(directory);

    const trackFile = (absolutePath: string, type: ActivityFileType, lastModificationDate: Date): void => {
      pathsList.push(new ActivityFile(type, absolutePath, lastModificationDate));
    };

    files.forEach(file => {
      const absolutePath = path.join(directory, file);
      const isDirectory = this.getFs().statSync(`${directory}/${file}`, { bigint: true }).isDirectory();

      if (isDirectory && absolutePath.match(FileConnector.SKIP_FOLDERS_REGEX)?.length) {
        return; // continue
      }

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

  public inflateActivitiesFromArchive(archiveFilePath: string, deleteArchive = false): Promise<string[]> {
    const fileName = path.basename(archiveFilePath);
    const currentArchiveDir = path.dirname(archiveFilePath);
    const archiveFileNameFingerPrint = Hash.apply(fileName, Hash.SHA256, { divide: 6 });
    const extractDir = currentArchiveDir + "/" + archiveFileNameFingerPrint;

    // Create extract directory
    if (this.getFs().existsSync(extractDir)) {
      this.getFs().rmSync(extractDir, { recursive: true });
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
              (relativeExtractedDirName ? "-" + Hash.apply(relativeExtractedDirName, Hash.SHA256, { divide: 6 }) : "") +
              "-" +
              extractedFileName;
            this.getFs().renameSync(extractedActivityFile.location.path, newActivityPath);
            trackedNewPaths.push(newActivityPath);
          });

          // Remove extract directory
          this.getFs().rmSync(extractDir, { recursive: true });

          if (deleteArchive) {
            this.getFs().unlinkSync(archiveFilePath);
          }

          return Promise.resolve(trackedNewPaths);
        } catch (err) {
          return Promise.reject(err);
        }
      })
      .catch(err => {
        this.getFs().rmSync(extractDir, { recursive: true });
        return Promise.reject(err);
      });
  }

  /**
   *
   * @return Promise of archive paths being inflated.
   */
  public scanInflateActivitiesFromArchives(
    sourceDir: string,
    deleteArchives: boolean,
    inflateNotifier: Subject<string> = new Subject<string>(),
    recursive = false
  ): Promise<void> {
    const files = this.getFs().readdirSync(sourceDir);

    return files
      .reduce((previousPromise: Promise<void>, file: string) => {
        return previousPromise.then(() => {
          if (this.stopRequested) {
            return Promise.reject(new StoppedSyncEvent(ConnectorType.FILE));
          }

          const isDirectory = this.getFs()
            .statSync(sourceDir + "/" + file, { bigint: true })
            .isDirectory();

          if (recursive && isDirectory) {
            return this.scanInflateActivitiesFromArchives(
              sourceDir + "/" + file,
              deleteArchives,
              inflateNotifier,
              recursive
            );
          }

          if (!isDirectory) {
            const absolutePath = path.join(sourceDir, file);

            if (UnArchiver.isArchiveFile(file) && !absolutePath.match(FileConnector.SKIP_FOLDERS_REGEX)?.length) {
              return this.inflateActivitiesFromArchive(absolutePath, deleteArchives).then(() => {
                if (inflateNotifier) {
                  inflateNotifier.next(absolutePath);
                }
                return Promise.resolve();
              });
            }
          }

          return Promise.resolve();
        });
      }, Promise.resolve())
      .then(() => {
        if (inflateNotifier) {
          inflateNotifier.complete();
        }
        return Promise.resolve();
      });
  }

  protected fetchAndHandleDeviceName(activityFile: ActivityFile, creator: CreatorJSONInterface): string {
    const isDeviceNameUnknown = creator?.name?.match(/unknown/i);
    const deviceName = isDeviceNameUnknown ? null : creator.name;

    // If fit file and not recognized with existing product Id by sports-lib then upload it for debug
    if (activityFile.type === ActivityFileType.FIT && !creator.isRecognized && creator.productId) {
      const reason = JSON.stringify({
        name: creator.name,
        productId: creator.productId,
        manufacturer: creator.manufacturer
      });

      // Track reason ids as hashes to avoid unknown device re-upload
      const reasonHashId = Hash.asObjectId(reason);

      // Test if an activity with an unknown device has been already uploaded.
      // If not send the files and track reason hash
      // Else don't upload and return device name
      if (this.unknownDevicesReasonsIds.indexOf(reasonHashId) === -1) {
        this.unknownDevicesReasonsIds.push(reasonHashId);
      }
    }

    return deviceName;
  }

  public wait(): Promise<void> {
    return sleep(FileConnector.SLEEP_TIME_BETWEEN_FILE_PARSED);
  }

  public getFs(): typeof fs {
    return fs;
  }
}
