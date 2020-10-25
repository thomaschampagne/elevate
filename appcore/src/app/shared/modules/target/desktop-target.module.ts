import { NgModule } from "@angular/core";
import { ElectronService } from "../../services/electron/electron.service";
import { IpcMessagesReceiver } from "../../../desktop/ipc-messages/ipc-messages-receiver.service";
import { IpcMessagesSender } from "../../../desktop/ipc-messages/ipc-messages-sender.service";
import { DesktopMigrationService } from "../../../desktop/migration/desktop-migration.service";
import { DesktopSyncService } from "../../services/sync/impl/desktop-sync.service";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";
import { PropertiesDao } from "../../dao/properties/properties.dao";
import { StravaConnectorInfoService } from "../../services/strava-connector-info/strava-connector-info.service";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { StravaConnectorService } from "../../../connectors/services/strava-connector.service";
import { FileSystemConnectorInfoService } from "../../services/file-system-connector-info/file-system-connector-info.service";
import { DataStore } from "../../data-store/data-store";
import { DesktopDataStore } from "../../data-store/impl/desktop-data-store.service";
import { PROMISE_TRON } from "../../../desktop/ipc-messages/promise-tron.interface";
import { PromiseTronService } from "../../../desktop/ipc-messages/promise-tron.service";
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
import { DesktopImportBackupDialogComponent } from "../../dialogs/import-backup-dialog/desktop-import-backup-dialog.component";
import { DesktopRoutingModule } from "../routing/desktop-routing.module";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule, ConnectorsModule],
  exports: [CoreModule, DesktopRoutingModule, ConnectorsModule],
  declarations: [DesktopAdvancedMenuComponent, DesktopImportBackupDialogComponent],
  providers: [
    ElectronService,
    IpcMessagesReceiver,
    IpcMessagesSender,
    DesktopMigrationService,
    DesktopSyncService,
    StravaConnectorInfoService,
    StravaConnectorService,
    ConnectorSyncDateTimeDao,
    PropertiesDao,
    StravaConnectorInfoDao,
    FileSystemConnectorInfoService,
    { provide: DataStore, useClass: DesktopDataStore },
    { provide: PROMISE_TRON, useClass: PromiseTronService },
    { provide: ActivityService, useClass: DesktopActivityService },
    { provide: VersionsProvider, useClass: DesktopVersionsProvider },
    { provide: OPEN_RESOURCE_RESOLVER, useClass: DesktopOpenResourceResolver },
    { provide: SyncService, useClass: DesktopSyncService }
  ]
})
export class TargetModule {}
