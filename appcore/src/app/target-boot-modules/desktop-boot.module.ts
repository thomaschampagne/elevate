import { NgModule } from "@angular/core";
import { MENU_ITEMS_PROVIDER } from "../shared/services/menu-items/menu-items-provider.interface";
import { DesktopMenuItemsProvider } from "../shared/services/menu-items/impl/desktop-menu-items-provider.service";
import { TOP_BAR_COMPONENT } from "../top-bar/top-bar.component";
import { DesktopTopBarComponent } from "../top-bar/desktop-top-bar.component";
import { AppLoadService } from "../app-load/app-load.service";
import { DesktopLoadService } from "../app-load/desktop/desktop-load.service";
import { APP_MORE_MENU_COMPONENT } from "../app-more-menu/app-more-menu.component";
import { DesktopAppMoreMenuComponent } from "../app-more-menu/desktop-app-more-menu.component";
import { DesktopSyncBarComponent } from "../sync-bar/desktop-sync-bar.component";
import { SYNC_BAR_COMPONENT } from "../sync-bar/sync-bar.component";
import { DesktopRefreshStatsBarComponent } from "../refresh-stats-bar/desktop-refresh-stats-bar.component";
import { REFRESH_STATS_BAR_COMPONENT } from "../refresh-stats-bar/refresh-stats-bar.component";
import { SYNC_MENU_COMPONENT } from "../sync-menu/sync-menu.component";
import { DesktopSyncMenuComponent } from "../sync-menu/desktop/desktop-sync-menu.component";
import { DesktopErrorsSyncDetailsDialogComponent } from "../sync-bar/desktop-errors-sync-details-dialog.component";
import { DesktopUnauthorizedMachineIdDialogComponent } from "../app-load/desktop/desktop-unauthorized-machine-id-dialog/desktop-unauthorized-machine-id-dialog.component";
import { CoreModule } from "../core/core.module";
import { DesktopRoutingModule } from "../shared/modules/desktop/desktop-routing.module";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule],
  exports: [CoreModule, DesktopRoutingModule],
  declarations: [
    DesktopRefreshStatsBarComponent,
    DesktopSyncBarComponent,
    DesktopTopBarComponent,
    DesktopAppMoreMenuComponent,
    DesktopSyncMenuComponent,
    DesktopErrorsSyncDetailsDialogComponent,
    DesktopUnauthorizedMachineIdDialogComponent
  ],
  providers: [
    { provide: AppLoadService, useClass: DesktopLoadService },
    { provide: MENU_ITEMS_PROVIDER, useClass: DesktopMenuItemsProvider },
    { provide: SYNC_BAR_COMPONENT, useValue: DesktopSyncBarComponent },
    { provide: REFRESH_STATS_BAR_COMPONENT, useValue: DesktopRefreshStatsBarComponent },
    { provide: TOP_BAR_COMPONENT, useValue: DesktopTopBarComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: DesktopAppMoreMenuComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: DesktopSyncMenuComponent }
  ]
})
export class TargetBootModule {}
