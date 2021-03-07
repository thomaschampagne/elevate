import { NgModule } from "@angular/core";
import { CoreModule } from "../../../core/core.module";
import { ExtensionAdvancedMenuComponent } from "../../../advanced-menu/extension/extension-advanced-menu.component";
import { DataStore } from "../../data-store/data-store";
import { ExtensionDataStore } from "../../data-store/impl/extension-data-store.service";
import { ActivityService } from "../../services/activity/activity.service";
import { ExtensionActivityService } from "../../services/activity/impl/extension-activity.service";
import { VersionsProvider } from "../../services/versions/versions-provider";
import { ExtensionVersionsProvider } from "../../services/versions/impl/extension-versions-provider.service";
import { OPEN_RESOURCE_RESOLVER } from "../../services/links-opener/open-resource-resolver";
import { ExtensionOpenResourceResolver } from "../../services/links-opener/impl/extension-open-resource-resolver.service";
import { SyncService } from "../../services/sync/sync.service";
import { ExtensionSyncService } from "../../services/sync/impl/extension-sync.service";
import { SyncDateTimeDao } from "../../dao/sync/sync-date-time.dao";
import { ExtensionRoutingModule } from "../routing/extension-routing.module";
import { UserSettingsService } from "../../services/user-settings/user-settings.service";
import { ExtensionUserSettingsService } from "../../services/user-settings/extension/extension-user-settings.service";
import { AthleteService } from "../../services/athlete/athlete.service";
import { ExtensionAthleteService } from "../../services/athlete/extension/extension-athlete.service";
import { ExtensionImportBackupDialogComponent } from "../../dialogs/backups/extension/extension-import-backup-dialog.component";

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [CoreModule, ExtensionRoutingModule],
  declarations: [ExtensionAdvancedMenuComponent, ExtensionImportBackupDialogComponent],
  providers: [
    SyncDateTimeDao,
    ExtensionSyncService,
    { provide: AthleteService, useClass: ExtensionAthleteService },
    { provide: UserSettingsService, useClass: ExtensionUserSettingsService },
    { provide: DataStore, useClass: ExtensionDataStore },
    { provide: ActivityService, useClass: ExtensionActivityService },
    { provide: VersionsProvider, useClass: ExtensionVersionsProvider },
    { provide: OPEN_RESOURCE_RESOLVER, useClass: ExtensionOpenResourceResolver },
    { provide: SyncService, useClass: ExtensionSyncService }
  ]
})
export class TargetModule {}
