import { NgModule } from "@angular/core";
import { DataStore } from "../../data-store/data-store";
import { AppEventsService } from "../../services/external-updates/app-events-service";
import { DesktopEventsService } from "../../services/external-updates/impl/desktop-events.service";
import { DesktopDataStore } from "../../data-store/impl/desktop-data-store.service";
import { VERSIONS_PROVIDER } from "../../services/versions/versions-provider.interface";
import { DesktopVersionsProvider } from "../../services/versions/impl/desktop-versions-provider.service";
import { SyncService } from "../../services/sync/sync.service";
import { DesktopSyncService } from "../../services/sync/impl/desktop-sync.service";
import { ElectronService } from "../../services/electron/electron.service";
import { IpcMessagesReceiver } from "../../../desktop/ipc-messages/ipc-messages-receiver.service";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { StravaConnectorInfoService } from "../../services/strava-connector-info/strava-connector-info.service";
import { ConnectorsModule } from "../../../connectors/connectors.module";
import { StravaConnectorService } from "../../../connectors/services/strava-connector.service";
import { DesktopImportBackupDialogComponent } from "../../dialogs/import-backup-dialog/import-backup-dialog.component";
import { CoreModule } from "../../../core/core.module";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";
import { DesktopRoutingModule } from "./desktop-routing.module";
import { DesktopAdvancedMenuComponent } from "../../../advanced-menu/desktop/desktop-advanced-menu.component";
import { DesktopMigrationService } from "../../../desktop/migration/desktop-migration.service";
import { FileSystemConnectorInfoService } from "../../services/file-system-connector-info/file-system-connector-info.service";
import { OPEN_RESOURCE_RESOLVER } from "../../services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../../services/links-opener/impl/desktop-open-resource-resolver.service";
import { ActivityService } from "../../services/activity/activity.service";
import { DesktopActivityService } from "../../services/activity/impl/desktop-activity.service";
import { PromiseTronService } from "../../../desktop/ipc-messages/promise-tron.service";
import { IpcMessagesSender } from "../../../desktop/ipc-messages/ipc-messages-sender.service";
import { PROMISE_TRON } from "../../../desktop/ipc-messages/promise-tron.interface";

@NgModule({
	imports: [
		CoreModule,
		ConnectorsModule,
		DesktopRoutingModule
	],
	exports: [
		ConnectorsModule,
		DesktopRoutingModule
	],
	declarations: [
		DesktopAdvancedMenuComponent,
		DesktopImportBackupDialogComponent
	],
	providers: [
		ElectronService,
		IpcMessagesReceiver,
		IpcMessagesSender,
		DesktopMigrationService,
		{provide: PROMISE_TRON, useClass: PromiseTronService},
		{provide: ActivityService, useClass: DesktopActivityService},
		{provide: DataStore, useClass: DesktopDataStore},
		{provide: AppEventsService, useClass: DesktopEventsService},
		{provide: VERSIONS_PROVIDER, useClass: DesktopVersionsProvider},
		{provide: OPEN_RESOURCE_RESOLVER, useClass: DesktopOpenResourceResolver},
		{provide: SyncService, useClass: DesktopSyncService},
		DesktopSyncService,
		ConnectorSyncDateTimeDao,
		StravaConnectorInfoService,
		StravaConnectorInfoDao,
		StravaConnectorService,
		FileSystemConnectorInfoService,
	]
})
export class DesktopModule {
}
