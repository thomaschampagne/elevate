import { saveAs } from "file-saver";
import { DataStore } from "../../data-store/data-store";
import { VersionsProvider } from "../versions/versions-provider";
import { AthleteService } from "../athlete/athlete.service";
import { SyncState } from "./sync-state.enum";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { StreamsService } from "../streams/streams.service";
import { LoggerService } from "../logging/logger.service";
import { ActivityService } from "../activity/activity.service";
import { Subject } from "rxjs";

export abstract class SyncService<T> {
  public isSyncing$: Subject<boolean>;

  constructor(
    public readonly versionsProvider: VersionsProvider,
    public readonly dataStore: DataStore<object>,
    public readonly activityService: ActivityService,
    public readonly streamsService: StreamsService,
    public readonly athleteService: AthleteService,
    public readonly userSettingsService: UserSettingsService,
    public readonly logger: LoggerService
  ) {
    this.isSyncing$ = new Subject<boolean>();
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

  public abstract backup(...args): any;

  public abstract restore(...arg): any;

  public abstract redirect(): void;

  public clearSyncedActivities(): Promise<void> {
    return this.clearSyncTime()
      .then(() => {
        return this.activityService.clear();
      })
      .then(() => {
        return this.streamsService.clear();
      })
      .then(() => {
        return this.dataStore.persist(true);
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
}
