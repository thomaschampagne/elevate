import { NgModule } from "@angular/core";
import { CoreModule } from "../../../core/core.module";
import { ExtensionAdvancedMenuComponent } from "../../../advanced-menu/extension/extension-advanced-menu.component";
import { ExtensionImportBackupDialogComponent } from "../../dialogs/import-backup-dialog/extension-import-backup-dialog.component";
import { DataStore } from "../../data-store/data-store";
import { ExtensionDataStore } from "../../data-store/impl/extension-data-store.service";
import { ActivityService } from "../../services/activity/activity.service";
import { ExtensionActivityService } from "../../services/activity/impl/extension-activity.service";
import { AppEventsService } from "../../services/external-updates/app-events-service";
import { ExtensionEventsService } from "../../services/external-updates/impl/extension-events.service";
import { VersionsProvider } from "../../services/versions/versions-provider";
import { ExtensionVersionsProvider } from "../../services/versions/impl/extension-versions-provider.service";
import { OPEN_RESOURCE_RESOLVER } from "../../services/links-opener/open-resource-resolver";
import { ExtensionOpenResourceResolver } from "../../services/links-opener/impl/extension-open-resource-resolver.service";
import { SyncService } from "../../services/sync/sync.service";
import { ExtensionSyncService } from "../../services/sync/impl/extension-sync.service";
import { SyncDateTimeDao } from "../../dao/sync/sync-date-time.dao";
import { ExtensionRoutingModule } from "../routing/extension-routing.module";

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [CoreModule, ExtensionRoutingModule],
  declarations: [ExtensionAdvancedMenuComponent, ExtensionImportBackupDialogComponent],
  providers: [
    SyncDateTimeDao,
    ExtensionSyncService,
    { provide: DataStore, useClass: ExtensionDataStore },
    { provide: ActivityService, useClass: ExtensionActivityService },
    { provide: AppEventsService, useClass: ExtensionEventsService },
    { provide: VersionsProvider, useClass: ExtensionVersionsProvider },
    { provide: OPEN_RESOURCE_RESOLVER, useClass: ExtensionOpenResourceResolver },
    { provide: SyncService, useClass: ExtensionSyncService }
  ]
})
export class TargetModule {}
