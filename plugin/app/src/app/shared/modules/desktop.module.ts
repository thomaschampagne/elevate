import { NgModule } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { AppEventsService } from "../services/external-updates/app-events-service";
import { DesktopEventsService } from "../services/external-updates/impl/desktop-events.service";
import { DesktopDataStore } from "../data-store/impl/desktop-data-store.service";
import { VERSIONS_PROVIDER } from "../services/versions/versions-provider.interface";
import { DesktopVersionsProvider } from "../services/versions/impl/desktop-versions-provider.service";
import { SyncService } from "../services/sync/sync.service";
import { DesktopSyncService } from "../services/sync/impl/desktop-sync.service";
import { ElectronService } from "../services/electron/electron.service";
import { IpcRendererMessagesService } from "../services/messages-listener/ipc-renderer-messages.service";
import { StravaApiCredentialsDao } from "../dao/strava-api-credentials/strava-api-credentials.dao";
import { StravaApiCredentialsService } from "../services/strava-api-credentials/strava-api-credentials.service";
import { ConnectorsModule } from "../../connectors/connectors.module";
import { StravaConnectorService } from "../../connectors/services/strava-connector.service";
import { DesktopImportBackupDialogComponent, } from "../dialogs/import-backup-dialog/import-backup-dialog.component";
import { CoreModule } from "../../core/core.module";
import { ConnectorLastSyncDateTimeDao } from "../dao/sync/connector-last-sync-date-time.dao";

@NgModule({
	imports: [
		CoreModule,
		ConnectorsModule
	],
	exports: [
		ConnectorsModule
	],
	declarations: [
		DesktopImportBackupDialogComponent
	],
	entryComponents: [
		DesktopImportBackupDialogComponent
	],
	providers: [
		ElectronService,
		IpcRendererMessagesService,
		{provide: DataStore, useClass: DesktopDataStore},
		{provide: AppEventsService, useClass: DesktopEventsService},
		{provide: SyncService, useClass: DesktopSyncService},
		{provide: VERSIONS_PROVIDER, useClass: DesktopVersionsProvider},
		ConnectorLastSyncDateTimeDao,
		StravaApiCredentialsService,
		StravaApiCredentialsDao,
		StravaConnectorService,
		// {provide: IMPORT_BACKUP_DIALOG_COMPONENT_TOKEN, useValue: DesktopImportBackupDialogComponent}
	]
})
export class DesktopModule {
}
