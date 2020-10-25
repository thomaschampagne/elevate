import { Inject } from "@angular/core";
import { ActivityService } from "../activity/activity.service";
import { SyncService } from "../sync/sync.service";
import { SyncState } from "../sync/sync-state.enum";
import { sleep } from "@elevate/shared/tools";
import { merge, Observable } from "rxjs";

export abstract class AppService {
  public static readonly VERIFY_ATHLETE_HISTORY_COMPLIANCE_TIMEOUT: number = 1500;
  public historyChanges$: Observable<void>;
  private _isAppLoaded: boolean;

  protected constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(SyncService) public readonly syncService: SyncService<any>
  ) {
    this._isAppLoaded = false;

    this.historyChanges$ = merge(this.syncService.syncDone$, this.activityService.recalculatedDone$);

    this.historyChanges$.subscribe(changes => {
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
