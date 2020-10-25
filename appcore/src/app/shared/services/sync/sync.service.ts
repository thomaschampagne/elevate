import { saveAs } from "file-saver";
import { DataStore } from "../../data-store/data-store";
import { VersionsProvider } from "../versions/versions-provider";
import { Inject } from "@angular/core";
import { AthleteService } from "../athlete/athlete.service";
import { SyncState } from "./sync-state.enum";
import semver from "semver/preload";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { StreamsService } from "../streams/streams.service";
import { LoggerService } from "../logging/logger.service";
import { ActivityService } from "../activity/activity.service";
import { DumpModel } from "../../models/dumps/dump.model";
import { environment } from "../../../../environments/environment";
import { Subject } from "rxjs";

export abstract class SyncService<T> {
  public syncDone$: Subject<void>;

  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(DataStore) public readonly dataStore: DataStore<object>,
    @Inject(ActivityService) public readonly activityService: ActivityService,
    @Inject(StreamsService) public readonly streamsService: StreamsService,
    @Inject(AthleteService) public readonly athleteService: AthleteService,
    @Inject(UserSettingsService) public readonly userSettingsService: UserSettingsService,
    @Inject(LoggerService) public readonly logger: LoggerService
  ) {
    this.syncDone$ = new Subject<void>();
  }

  /**
   * Promise of sync start
   */
  public abstract sync(fastSync: boolean, forceSync: boolean): Promise<void>;

  public abstract stop(): Promise<void>;

  public abstract getSyncDateTime(): Promise<T>;

  public abstract updateSyncDateTime(value: T): Promise<T>;

  public abstract clearSyncTime(): Promise<void>;

  public abstract getSyncState(): Promise<SyncState>;

  public abstract export(): Promise<{ filename: string; size: number }>;

  public abstract import(dumpModel: DumpModel): Promise<void>;

  public abstract getCompatibleBackupVersionThreshold(): string;

  public clearSyncedActivities(): Promise<void> {
    return this.clearSyncTime()
      .then(() => {
        return this.activityService.clear(true);
      })
      .then(() => {
        return this.streamsService.clear(true);
      })
      .then(() => {
        return this.dataStore.saveDataStore();
      })
      .catch(error => {
        this.logger.error(error);
        return Promise.reject(
          "Athlete synced data has not been cleared totally. " +
            "Some properties cannot be deleted. You may need to uninstall/install the software."
        );
      });
  }

  public saveAs(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }

  public isDumpCompatible(dumpVersion, compatibleDumpVersionThreshold): Promise<void> {
    if (environment.skipRestoreSyncedBackupCheck) {
      return Promise.resolve();
    }

    // Check if imported backup is compatible with current code
    if (semver.lt(dumpVersion, compatibleDumpVersionThreshold)) {
      const appVersion = this.versionsProvider.getPackageVersion();
      return Promise.reject(
        `Imported backup version ${dumpVersion} is not compatible with current installed version ${appVersion}.`
      );
    } else {
      return Promise.resolve();
    }
  }
}
