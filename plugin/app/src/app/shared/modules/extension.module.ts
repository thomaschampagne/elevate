import { NgModule } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { ChromeDataStore } from "../data-store/impl/chrome-data-store.service";
import { AppEventsService } from "../services/external-updates/app-events-service";
import { ChromeEventsService } from "../services/external-updates/impl/chrome-events.service";
import { VERSIONS_PROVIDER } from "../services/versions/versions-provider.interface";
import { ChromeVersionsProvider } from "../services/versions/impl/chrome-versions-provider.service";
import { SyncService } from "../services/sync/sync.service";
import { ChromeSyncService } from "../services/sync/impl/chrome-sync.service";
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
		{provide: DataStore, useClass: ChromeDataStore},
		{provide: AppEventsService, useClass: ChromeEventsService},
		{provide: VERSIONS_PROVIDER, useClass: ChromeVersionsProvider},

		{provide: SyncService, useClass: ChromeSyncService},
		ChromeSyncService,
	]
})
export class ExtensionModule {
}
