import { NgModule } from "@angular/core";
import { ElectronService } from "../../../desktop/electron/electron.service";
import { IpcSyncMessagesListener } from "../../../desktop/ipc/ipc-sync-messages-listener.service";
import { DesktopMigrationService } from "../../../desktop/migration/desktop-migration.service";
import { DesktopSyncService } from "../../services/sync/impl/desktop-sync.service";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";
import { PropertiesDao } from "../../dao/properties/properties.dao";
import { StravaConnectorInfoService } from "../../services/strava-connector-info/strava-connector-info.service";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { StravaConnectorService } from "../../../connectors/strava-connector/strava-connector.service";
import { FileConnectorInfoService } from "../../services/file-connector-info/file-connector-info.service";
import { DataStore } from "../../data-store/data-store";
import { DesktopDataStore } from "../../data-store/impl/desktop-data-store.service";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelService } from "../../../desktop/ipc/ipc-renderer-tunnel.service";
import { ActivityService } from "../../services/activity/activity.service";
import { DesktopActivityService } from "../../services/activity/impl/desktop-activity.service";
import { VersionsProvider } from "../../services/versions/versions-provider";
import { DesktopVersionsProvider } from "../../services/versions/impl/desktop-versions-provider.service";
import { OPEN_RESOURCE_RESOLVER } from "../../services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../../services/links-opener/impl/desktop-open-resource-resolver.service";
import { SyncService } from "../../services/sync/sync.service";
import { CoreModule } from "../../../core/core.module";
import { ConnectorsModule } from "../../../connectors/connectors.module";
import { DesktopAdvancedMenuComponent } from "../../../advanced-menu/desktop/desktop-advanced-menu.component";
import { DesktopBackupDialogComponent } from "../../dialogs/backups/desktop/desktop-backup-dialog.component";
import { DesktopRoutingModule } from "../routing/desktop-routing.module";
import { UserSettingsService } from "../../services/user-settings/user-settings.service";
import { DesktopUserSettingsService } from "../../services/user-settings/desktop/desktop-user-settings.service";
import { AthleteService } from "../../services/athlete/athlete.service";
import { DesktopAthleteService } from "../../services/athlete/desktop/desktop-athlete.service";
import { IpcSyncMessageSender } from "../../../desktop/ipc/ipc-sync-messages-sender.service";
import { DesktopRestoreDialogComponent } from "../../dialogs/backups/desktop/desktop-restore-dialog.component";
import { DesktopBackupService } from "../../../desktop/backup/desktop-backup.service";
import { DesktopUpdateService } from "../../../desktop/app-update/desktop-update.service";
import { IpcStorageService } from "../../../desktop/ipc/ipc-storage.service";
import { WindowService } from "../../services/window/window.service";
import { DesktopWindowService } from "../../services/window/desktop-window.service";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule, ConnectorsModule],
  exports: [CoreModule, DesktopRoutingModule, ConnectorsModule],
  declarations: [DesktopAdvancedMenuComponent, DesktopBackupDialogComponent, DesktopRestoreDialogComponent],
  providers: [
    ElectronService,
    IpcStorageService,
    DesktopUpdateService,
    IpcSyncMessagesListener,
    IpcSyncMessageSender,
    DesktopMigrationService,
    DesktopSyncService,
    DesktopBackupService,
    StravaConnectorInfoService,
    StravaConnectorService,
    ConnectorSyncDateTimeDao,
    PropertiesDao,
    StravaConnectorInfoDao,
    FileConnectorInfoService,
    { provide: WindowService, useClass: DesktopWindowService },
    { provide: AthleteService, useClass: DesktopAthleteService },
    { provide: UserSettingsService, useClass: DesktopUserSettingsService },
    { provide: DataStore, useClass: DesktopDataStore },
    { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelService },
    { provide: ActivityService, useClass: DesktopActivityService },
    { provide: VersionsProvider, useClass: DesktopVersionsProvider },
    { provide: OPEN_RESOURCE_RESOLVER, useClass: DesktopOpenResourceResolver },
    { provide: SyncService, useClass: DesktopSyncService }
  ]
})
export class TargetModule {}
