import { Inject } from "@angular/core";
import { ActivityService } from "../activity/activity.service";
import { SyncService } from "../sync/sync.service";
import { SyncState } from "../sync/sync-state.enum";
import { sleep } from "@elevate/shared/tools";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { Theme } from "../../enums/theme.enum";

export abstract class AppService {
  public static readonly VERIFY_ATHLETE_HISTORY_COMPLIANCE_TIMEOUT: number = 1500;
  public static readonly LS_USER_THEME_PREF: string = "theme";

  public currentTheme: Theme;
  public isSyncing: boolean;
  public historyChanges$: Observable<void>;
  public themeChanges$: Subject<Theme>;
  public isAppLoaded: boolean;

  protected constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(SyncService) private readonly syncService: SyncService<any>
  ) {
    this.themeChanges$ = new Subject<Theme>();

    this.isAppLoaded = false;

    // Forward isSyncing$ from syncService to local observable
    this.syncService.isSyncing$.subscribe(isSyncing => {
      this.isSyncing = isSyncing;
    });

    // End of syncing (including recalculation done) is seen as "history has changed"
    this.historyChanges$ = this.syncService.isSyncing$.pipe(
      filter(isSyncing => isSyncing === false),
      map(() => {})
    );

    this.historyChanges$.subscribe(() => {
      this.verifyHistoryCompliance();
    });
  }

  public init(): void {
    this.loadTheme();

    this.isAppLoaded = true;

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

  public loadTheme(): void {
    let defaultTheme: Theme = Theme.DEFAULT;

    const existingSavedTheme = localStorage.getItem(AppService.LS_USER_THEME_PREF) as Theme;

    if (existingSavedTheme) {
      defaultTheme = existingSavedTheme;
    }

    this.currentTheme = defaultTheme;
  }

  public toggleTheme(): void {
    // Find target theme
    const targetTheme = this.currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;

    // Assign new value
    this.currentTheme = targetTheme;

    // Notify observers
    this.themeChanges$.next(this.currentTheme);

    // Save locally
    localStorage.setItem(AppService.LS_USER_THEME_PREF, targetTheme);
  }
}
