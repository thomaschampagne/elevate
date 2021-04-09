import { Inject, Injectable } from "@angular/core";
import { AppService } from "../app.service";
import { ActivityService } from "../../activity/activity.service";
import { DesktopSyncService } from "../../sync/impl/desktop-sync.service";
import { SyncService } from "../../sync/sync.service";
import { DesktopActivityService } from "../../activity/impl/desktop-activity.service";
import { UserSettings } from "@elevate/shared/models";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DesktopMigrationService } from "../../../../desktop/migration/desktop-migration.service";
import { Channel, IpcMessage, IpcTunnelService, RuntimeInfo } from "@elevate/shared/electron";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

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

    // Trigger recalculation after upgrade/migration
    const recalculationRequiredByVersion = this.desktopMigrationService.recalculateRequiredByVersion();
    if (recalculationRequiredByVersion) {
      // Observe for recalculation done asked by an applied migration
      this.userSettingsService.fetch().then((userSettingsModel: DesktopUserSettingsModel) => {
        const snackRef = this.snackBar.open("Last upgrade requires activities recalculation. Let it proceed.", "Ok");
        this.activityService.recalculateAll(userSettingsModel).then(() => {
          this.desktopMigrationService.clearRequiredRecalculation();
          snackRef.dismiss();
        });
      });
    }
  }

  public getRuntimeInfo(): Promise<RuntimeInfo> {
    return this.ipcTunnelService.send<void, RuntimeInfo>(new IpcMessage(Channel.runtimeInfo));
  }
}
