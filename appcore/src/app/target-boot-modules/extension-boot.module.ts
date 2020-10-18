import { NgModule } from "@angular/core";
import { MENU_ITEMS_PROVIDER } from "../shared/services/menu-items/menu-items-provider.interface";
import { ExtensionMenuItemsProvider } from "../shared/services/menu-items/impl/extension-menu-items-provider.service";
import { SharedModule } from "../shared/shared.module";
import { TOP_BAR_COMPONENT } from "../top-bar/top-bar.component";
import { ExtensionTopBarComponent } from "../top-bar/extension-top-bar.component";
import { AppLoadService } from "../app-load/app-load.service";
import { ExtensionLoadService } from "../app-load/extension/extension-load.service";
import { APP_MORE_MENU_COMPONENT } from "../app-more-menu/app-more-menu.component";
import { ExtensionAppMoreMenuComponent } from "../app-more-menu/extension-app-more-menu.component";
import { SYNC_BAR_COMPONENT } from "../sync-bar/sync-bar.component";
import { ExtensionSyncBarComponent } from "../sync-bar/extension-sync-bar.component";
import { ExtensionRefreshStatsBarComponent } from "../refresh-stats-bar/extension-refresh-stats-bar.component";
import { REFRESH_STATS_BAR_COMPONENT } from "../refresh-stats-bar/refresh-stats-bar.component";
import { SYNC_MENU_COMPONENT } from "../sync-menu/sync-menu.component";
import { ExtensionSyncMenuComponent } from "../sync-menu/extension/extension-sync-menu.component";

@NgModule({
  imports: [SharedModule],
  declarations: [
    ExtensionRefreshStatsBarComponent,
    ExtensionSyncBarComponent,
    ExtensionTopBarComponent,
    ExtensionAppMoreMenuComponent,
    ExtensionSyncMenuComponent
  ],
  providers: [
    { provide: AppLoadService, useClass: ExtensionLoadService },
    { provide: MENU_ITEMS_PROVIDER, useClass: ExtensionMenuItemsProvider },
    { provide: SYNC_BAR_COMPONENT, useValue: ExtensionSyncBarComponent },
    { provide: REFRESH_STATS_BAR_COMPONENT, useValue: ExtensionRefreshStatsBarComponent },
    { provide: TOP_BAR_COMPONENT, useValue: ExtensionTopBarComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: ExtensionAppMoreMenuComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: ExtensionSyncMenuComponent }
  ]
})
export class TargetBootModule {}
