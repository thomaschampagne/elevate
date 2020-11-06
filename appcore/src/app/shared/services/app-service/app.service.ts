import { Inject } from "@angular/core";
import { ActivityService } from "../activity/activity.service";
import { SyncService } from "../sync/sync.service";
import { SyncState } from "../sync/sync-state.enum";
import { sleep } from "@elevate/shared/tools";
import { merge, Observable } from "rxjs";
import { filter, map } from "rxjs/operators";

export abstract class AppService {
  public static readonly VERIFY_ATHLETE_HISTORY_COMPLIANCE_TIMEOUT: number = 1500;
  public isSyncing: boolean;
  public historyChanges$: Observable<void>;
  private _isAppLoaded: boolean;

  protected constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(SyncService) private readonly syncService: SyncService<any>
  ) {
    this._isAppLoaded = false;

    // Forward isSyncing$ from syncService to local observable
    this.syncService.isSyncing$.subscribe(isSyncing => {
      this.isSyncing = isSyncing;
    });

    // Merge syncing and recalculation done as "history has changed"
    this.historyChanges$ = merge(
      this.syncService.isSyncing$.pipe(
        filter(isSyncing => isSyncing === false),
        map(() => {})
      ),
      this.activityService.recalculatedDone$
    );

    this.historyChanges$.subscribe(() => {
      this.verifyHistoryCompliance();
    });
  }

  public init(): void {
    this._isAppLoaded = true;

    this.syncService.getSyncState().then(syncState => {
      if (syncState >= SyncState.PARTIALLY_SYNCED) {
        sleep(AppService.VERIFY_ATHLETE_HISTORY_COMPLIANCE_TIMEOUT).then(() => {
          this.verifyHistoryCompliance();
        });
      }
    });
  }

  public verifyHistoryCompliance(): void {
    this.activityService.verifyActivitiesWithSettingsLacking();
    this.activityService.verifyConsistencyWithAthleteSettings();
  }

  public get isAppLoaded(): boolean {
    return this._isAppLoaded;
  }
}
