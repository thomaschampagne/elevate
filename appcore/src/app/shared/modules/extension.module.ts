import { NgModule } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { ExtensionDataStore } from "../data-store/impl/extension-data-store.service";
import { AppEventsService } from "../services/external-updates/app-events-service";
import { ExtensionEventsService } from "../services/external-updates/impl/extension-events.service";
import { VERSIONS_PROVIDER } from "../services/versions/versions-provider.interface";
import { ExtensionVersionsProvider } from "../services/versions/impl/extension-versions-provider.service";
import { SyncService } from "../services/sync/sync.service";
import { ExtensionSyncService } from "../services/sync/impl/extension-sync.service";
import { CoreModule } from "../../core/core.module";
import { ExtensionImportBackupDialogComponent, } from "../dialogs/import-backup-dialog/import-backup-dialog.component";
import { SyncDateTimeDao } from "../dao/sync/sync-date-time-dao.service";

@NgModule({
	imports: [
		CoreModule,
	],
	declarations: [
		ExtensionImportBackupDialogComponent,
	],
	entryComponents: [
		ExtensionImportBackupDialogComponent,
	],
	providers: [
		SyncDateTimeDao,
		{provide: DataStore, useClass: ExtensionDataStore},
		{provide: AppEventsService, useClass: ExtensionEventsService},
		{provide: VERSIONS_PROVIDER, useClass: ExtensionVersionsProvider},

		{provide: SyncService, useClass: ExtensionSyncService},
		ExtensionSyncService,
	]
})
export class ExtensionModule {
}
