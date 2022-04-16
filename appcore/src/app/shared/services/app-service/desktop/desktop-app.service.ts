import { Inject, Injectable } from "@angular/core";
import { AppService } from "../app.service";
import { ActivityService } from "../../activity/activity.service";
import { DesktopSyncService } from "../../sync/impl/desktop-sync.service";
import { SyncService } from "../../sync/sync.service";
import { DesktopActivityService } from "../../activity/impl/desktop-activity.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DesktopMigrationService } from "../../../../desktop/migration/desktop-migration.service";
import _ from "lodash";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Injectable()
export class DesktopAppService extends AppService {
  constructor(
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(DesktopMigrationService) protected readonly desktopMigrationService: DesktopMigrationService,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {
    super(activityService, desktopSyncService);
  }

  public init(): void {
    super.init();
    this.recalculateActivitiesIfRequired();
  }

  private recalculateActivitiesIfRequired(): void {
    // Trigger recalculation after upgrade/migration once the current call stack has cleared with _.defer
    _.defer(() => {
      this.desktopMigrationService.recalculateRequestedBy().then(requestedByVersion => {
        if (requestedByVersion) {
          // Observe for recalculation done asked by an applied migration
          this.userSettingsService.fetch().then((userSettings: DesktopUserSettings) => {
            const snackRef = this.snackBar.open("Activities recalculation required. Let it proceed...", "Ok");
            this.activityService.recalculateAll(userSettings).then(() => {
              this.desktopMigrationService.clearRequiredRecalculation();
              snackRef.dismiss();
            });
          });
        }
      });
    });
  }
}
