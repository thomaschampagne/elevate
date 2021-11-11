import { Inject, Injectable } from "@angular/core";
import { AppService } from "../app.service";
import { ActivityService } from "../../activity/activity.service";
import { DesktopSyncService } from "../../sync/impl/desktop-sync.service";
import { SyncService } from "../../sync/sync.service";
import { DesktopActivityService } from "../../activity/impl/desktop-activity.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DesktopMigrationService } from "../../../../desktop/migration/desktop-migration.service";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import _ from "lodash";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Channel } from "@elevate/shared/electron/channels.enum";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Injectable()
export class DesktopAppService extends AppService {
  constructor(
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(SyncService) public readonly desktopSyncService: DesktopSyncService,
    @Inject(DesktopMigrationService) private readonly desktopMigrationService: DesktopMigrationService,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar
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
            const snackRef = this.snackBar.open(
              "Last upgrade requires activities recalculation. Let it proceed.",
              "Ok"
            );
            this.activityService.recalculateAll(userSettings).then(() => {
              this.desktopMigrationService.clearRequiredRecalculation();
              snackRef.dismiss();
            });
          });
        }
      });
    });
  }

  public getRuntimeInfo(): Promise<RuntimeInfo> {
    return this.ipcTunnelService.send<void, RuntimeInfo>(new IpcMessage(Channel.runtimeInfo));
  }
}
