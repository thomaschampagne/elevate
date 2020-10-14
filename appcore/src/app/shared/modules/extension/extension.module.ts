import { NgModule } from "@angular/core";
import { AppEventsService } from "../../services/external-updates/app-events-service";
import { ExtensionEventsService } from "../../services/external-updates/impl/extension-events.service";
import { ExtensionVersionsProvider } from "../../services/versions/impl/extension-versions-provider.service";
import { SyncService } from "../../services/sync/sync.service";
import { ExtensionSyncService } from "../../services/sync/impl/extension-sync.service";
import { CoreModule } from "../../../core/core.module";
import { ExtensionImportBackupDialogComponent } from "../../dialogs/import-backup-dialog/import-backup-dialog.component";
import { SyncDateTimeDao } from "../../dao/sync/sync-date-time.dao";
import { ExtensionRoutingModule } from "./extension-routing.module";
import { ExtensionAdvancedMenuComponent } from "../../../advanced-menu/extension/extension-advanced-menu.component";
import { OPEN_RESOURCE_RESOLVER } from "../../services/links-opener/open-resource-resolver";
import { ExtensionOpenResourceResolver } from "../../services/links-opener/impl/extension-open-resource-resolver.service";
import { ActivityService } from "../../services/activity/activity.service";
import { ExtensionActivityService } from "../../services/activity/impl/extension-activity.service";
import { DataStore } from "../../data-store/data-store";
import { ExtensionDataStore } from "../../data-store/impl/extension-data-store.service";
import { VersionsProvider } from "../../services/versions/versions-provider";

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [ExtensionRoutingModule],
  declarations: [ExtensionAdvancedMenuComponent, ExtensionImportBackupDialogComponent],
  providers: [
    { provide: DataStore, useClass: ExtensionDataStore },
    { provide: ActivityService, useClass: ExtensionActivityService },
    { provide: AppEventsService, useClass: ExtensionEventsService },
    { provide: VersionsProvider, useClass: ExtensionVersionsProvider },
    { provide: OPEN_RESOURCE_RESOLVER, useClass: ExtensionOpenResourceResolver },
    { provide: SyncService, useClass: ExtensionSyncService },
    SyncDateTimeDao,
    ExtensionSyncService
  ]
})
export class ExtensionModule {}
