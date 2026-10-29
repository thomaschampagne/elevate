import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { AppService } from "../../app-service";
import { ActivityTypes } from "@thomaschampagne/sports-lib/lib/activities/activity.types";
import { FileConnectorConfig } from "../connector-config.model";
import { inject, singleton } from "tsyringe";
import { Hash } from "../../tools/hash";
import { UnArchiver } from "./un-archiver";
import { SportsLibActivityMapper } from "../sports-lib/sports-lib-activity.mapper";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import moment from "moment";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { LapJSONInterface } from "@thomaschampagne/sports-lib/lib/laps/lap.json.interface";
import { EventJSONInterface } from "@thomaschampagne/sports-lib/lib/events/event.json.interface";
import { ActivityFile } from "./activity-file.model";
import { WorkerService } from "../../worker-service";
import { SportsLibWorkerParams } from "../../workers/sports-lib.worker";
import { sleep } from "@elevate/shared/tools/sleep";
import { extension } from "@elevate/shared/tools/extension";
import { basename } from "@elevate/shared/tools/basename";
import { WorkerType } from "../../enum/worker-type.enum";
import { HttpClient } from "../../clients/http.client";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { CreatorJSONInterface } from "@thomaschampagne/sports-lib/lib/creators/creator.json.interface";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { Activity, ActivityExtras, ActivityStats, Lap } from "@elevate/shared/models/sync/activity.model";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";

@singleton()
export class FileConnector extends BaseConnector {
  private static readonly SLEEP_TIME_BETWEEN_FILE_PARSED: number = 5;
  private static readonly SKIP_FOLDERS_REGEX: RegExp = /__macosx|\$recycle.bin|\.trash/gi;

  private static readonly HumanizedDayMoment = SportsLibActivityMapper.HumanizedDayMoment;

  private static readonly ENABLED: boolean = true;
  private static readonly SPORTS_LIB_TO_ELEVATE_SPORTS_MAP = SportsLibActivityMapper.SPORTS_LIB_TO_ELEVATE_SPORTS_MAP;

  private fileConnectorConfig: FileConnectorConfig;

  private readonly unknownDevicesReasonsIds: string[];

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(UnArchiver) public readonly unArchiver: UnArchiver,
    @inject(SportsLibActivityMapper) public readonly sportsLibActivityMapper: SportsLibActivityMapper,
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

  public processLaps(sport: ElevateSport, sportsLibLaps: LapJSONInterface[]): Lap[] {
    return this.sportsLibActivityMapper.processLaps(sport, sportsLibLaps);
  }

  public createBareActivity(sportsLibActivity: ActivityJSONInterface): BareActivity {
    return this.sportsLibActivityMapper.createBareActivity(
      sportsLibActivity,
      this.convertToElevateSport(sportsLibActivity)
    );
  }

  public getSourceStats(
    sport: ElevateSport,
    source: Partial<ActivityJSONInterface>,
    streams: Streams
  ): Partial<ActivityStats> {
    return this.sportsLibActivityMapper.getSourceStats(sport, source, streams);
  }

  public convertToElevateSport(sportsLibActivity: ActivityJSONInterface): {
    type: ElevateSport;
    autoDetected: boolean;
  } {
    return this.sportsLibActivityMapper.convertToElevateSport(sportsLibActivity);
  }

  public mapStreams(sportsLibActivity: ActivityJSONInterface): Streams {
    return this.sportsLibActivityMapper.mapStreams(sportsLibActivity);
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
