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
import { DesktopRecalculateActivitiesBarComponent } from "../recalculate-activities-bar/desktop-recalculate-activities-bar.component";
import { RECALCULATE_ACTIVITIES_BAR_COMPONENT } from "../recalculate-activities-bar/recalculate-activities-bar.component";
import { SYNC_MENU_COMPONENT } from "../sync-menu/sync-menu.component";
import { DesktopSyncMenuComponent } from "../sync-menu/desktop/desktop-sync-menu.component";
import { DesktopErrorsSyncDetailsDialogComponent } from "../sync-bar/desktop-errors-sync-details-dialog.component";
import { DesktopUnauthorizedMachineIdDialogComponent } from "../app-load/desktop/desktop-unauthorized-machine-id-dialog/desktop-unauthorized-machine-id-dialog.component";
import { CoreModule } from "../core/core.module";
import { DesktopRoutingModule } from "../shared/modules/routing/desktop-routing.module";
import { AppService } from "../shared/services/app-service/app.service";
import { DesktopAppService } from "../shared/services/app-service/desktop/desktop-app.service";
import { UPDATE_BAR_COMPONENT } from "../update-bar/update-bar.component";
import { DesktopUpdateBarComponent } from "../update-bar/desktop-update-bar.component";
import { DesktopSplashScreenComponent } from "../app-load/desktop/desktop-splash-screen.component";
import { SPLASH_SCREEN_COMPONENT } from "../app-load/splash-screen.component";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule],
  exports: [CoreModule, DesktopRoutingModule],
  declarations: [
    DesktopSplashScreenComponent,
    DesktopRecalculateActivitiesBarComponent,
    DesktopUpdateBarComponent,
    DesktopSyncBarComponent,
    DesktopTopBarComponent,
    DesktopAppMoreMenuComponent,
    DesktopSyncMenuComponent,
    DesktopErrorsSyncDetailsDialogComponent,
    DesktopUnauthorizedMachineIdDialogComponent
  ],
  providers: [
    { provide: AppLoadService, useClass: DesktopLoadService },
    { provide: AppService, useClass: DesktopAppService },
    { provide: SPLASH_SCREEN_COMPONENT, useValue: DesktopSplashScreenComponent },
    { provide: MENU_ITEMS_PROVIDER, useClass: DesktopMenuItemsProvider },
    { provide: UPDATE_BAR_COMPONENT, useValue: DesktopUpdateBarComponent },
    { provide: SYNC_BAR_COMPONENT, useValue: DesktopSyncBarComponent },
    { provide: RECALCULATE_ACTIVITIES_BAR_COMPONENT, useValue: DesktopRecalculateActivitiesBarComponent },
    { provide: TOP_BAR_COMPONENT, useValue: DesktopTopBarComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: DesktopAppMoreMenuComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: DesktopSyncMenuComponent }
  ]
})
export class TargetBootModule {}
