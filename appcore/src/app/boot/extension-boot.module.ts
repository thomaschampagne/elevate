import { ErrorHandler, NgModule } from "@angular/core";
import { MENU_ITEMS_PROVIDER } from "../shared/services/menu-items/menu-items-provider.interface";
import { ExtensionMenuItemsProvider } from "../shared/services/menu-items/impl/extension-menu-items-provider.service";
import { TOP_BAR_COMPONENT } from "../top-bar/top-bar.component";
import { ExtensionTopBarComponent } from "../top-bar/extension-top-bar.component";
import { AppLoadService } from "../app-load/app-load.service";
import { ExtensionLoadService } from "../app-load/extension/extension-load.service";
import { APP_MORE_MENU_COMPONENT } from "../app-more-menu/app-more-menu.component";
import { ExtensionAppMoreMenuComponent } from "../app-more-menu/extension-app-more-menu.component";
import { SYNC_BAR_COMPONENT } from "../sync-bar/sync-bar.component";
import { ExtensionSyncBarComponent } from "../sync-bar/extension-sync-bar.component";
import { ExtensionRecalculateActivitiesBarComponent } from "../recalculate-activities-bar/extension-recalculate-activities-bar.component";
import { RECALCULATE_ACTIVITIES_BAR_COMPONENT } from "../recalculate-activities-bar/recalculate-activities-bar.component";
import { SYNC_MENU_COMPONENT } from "../sync-menu/sync-menu.component";
import { ExtensionSyncMenuComponent } from "../sync-menu/extension/extension-sync-menu.component";
import { ExtensionRoutingModule } from "../shared/modules/routing/extension-routing.module";
import { CoreModule } from "../core/core.module";
import { AppService } from "../shared/services/app-service/app.service";
import { ChromiumService } from "../extension/chromium.service";
import { ExtensionAppService } from "../shared/services/app-service/extension/extension-app.service";
import { UPDATE_BAR_COMPONENT } from "../update-bar/update-bar.component";
import { ExtensionUpdateBarComponent } from "../update-bar/extension-update-bar.component";
import { ExtensionSplashScreenComponent } from "../app-load/extension/extension-splash-screen.component";
import { SPLASH_SCREEN_COMPONENT } from "../app-load/splash-screen.component";
import { ExtensionElevateErrorHandler } from "../errors-handler/extension-elevate-error-handler";

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [CoreModule, ExtensionRoutingModule],
  declarations: [
    ExtensionSplashScreenComponent,
    ExtensionRecalculateActivitiesBarComponent,
    ExtensionUpdateBarComponent,
    ExtensionSyncBarComponent,
    ExtensionTopBarComponent,
    ExtensionAppMoreMenuComponent,
    ExtensionSyncMenuComponent
  ],
  providers: [
    ChromiumService,
    { provide: ErrorHandler, useClass: ExtensionElevateErrorHandler },
    { provide: SPLASH_SCREEN_COMPONENT, useValue: ExtensionSplashScreenComponent },
    { provide: AppLoadService, useClass: ExtensionLoadService },
    { provide: AppService, useClass: ExtensionAppService },
    { provide: MENU_ITEMS_PROVIDER, useClass: ExtensionMenuItemsProvider },
    { provide: UPDATE_BAR_COMPONENT, useValue: ExtensionUpdateBarComponent },
    { provide: SYNC_BAR_COMPONENT, useValue: ExtensionSyncBarComponent },
    { provide: RECALCULATE_ACTIVITIES_BAR_COMPONENT, useValue: ExtensionRecalculateActivitiesBarComponent },
    { provide: TOP_BAR_COMPONENT, useValue: ExtensionTopBarComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: ExtensionAppMoreMenuComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: ExtensionSyncMenuComponent }
  ]
})
export class TargetBootModule {}
