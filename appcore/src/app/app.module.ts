import { ErrorHandler, NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { SYNC_MENU_COMPONENT, SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { BuildTarget } from "@elevate/shared/enums";
import { environment } from "../environments/environment";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { DesktopSyncMenuComponent } from "./sync-menu/desktop/desktop-sync-menu.component";
import { ExtensionSyncMenuComponent } from "./sync-menu/extension/extension-sync-menu.component";
import { TopBarComponent } from "./top-bar/top-bar.component";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { ElevateErrorHandler } from "./elevate-error-handler";
import {
  DesktopSyncBarComponent,
  ExtensionSyncBarComponent,
  SYNC_BAR_COMPONENT,
  SyncBarComponent
} from "./sync-bar/sync-bar.component";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import {
  APP_MORE_MENU_COMPONENT,
  AppMoreMenuComponent,
  DesktopAppMoreMenuComponent,
  ExtensionAppMoreMenuComponent
} from "./app-more-menu/app-more-menu.component";
import { AppMoreMenuDirective } from "./app-more-menu/app-more-menu.directive";
import { DesktopRoutingModule } from "./shared/modules/desktop/desktop-routing.module";
import { ExtensionRoutingModule } from "./shared/modules/extension/extension-routing.module";
import { DesktopUnauthorizedMachineIdDialogComponent } from "./app-load/desktop/desktop-unauthorized-machine-id-dialog/desktop-unauthorized-machine-id-dialog.component";
import {
  DesktopRefreshStatsBarComponent,
  ExtensionRefreshStatsBarComponent,
  REFRESH_STATS_BAR_COMPONENT,
  RefreshStatsBarComponent
} from "./refresh-stats-bar/refresh-stats-bar.component";
import { RefreshStatsBarDirective } from "./refresh-stats-bar/refresh-stats-bar.directive";
import { DesktopErrorsSyncDetailsDialogComponent } from "./sync-bar/desktop-errors-sync-details-dialog.component";
import { AppLoadComponent } from "./app-load/app-load.component";
import { AppLoadService } from "./app-load/app-load.service";
import { DesktopLoadService } from "./app-load/desktop/desktop-load.service";
import { ExtensionLoadService } from "./app-load/extension/extension-load.service";
import { TargetBootModule } from "./target-boot-modules/target-boot.module";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule],
  exports: [CoreModule, DesktopRoutingModule],
  declarations: [
    DesktopSyncMenuComponent,
    DesktopSyncBarComponent,
    DesktopErrorsSyncDetailsDialogComponent,
    DesktopRefreshStatsBarComponent,
    DesktopUnauthorizedMachineIdDialogComponent,
    DesktopAppMoreMenuComponent
  ],
  providers: [
    { provide: AppLoadService, useClass: DesktopLoadService },
    { provide: SYNC_BAR_COMPONENT, useValue: DesktopSyncBarComponent },
    { provide: REFRESH_STATS_BAR_COMPONENT, useValue: DesktopRefreshStatsBarComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: DesktopSyncMenuComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: DesktopAppMoreMenuComponent }
  ]
})
export class DesktopBootModule {}

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [CoreModule, ExtensionRoutingModule],
  declarations: [
    ExtensionSyncBarComponent,
    ExtensionRefreshStatsBarComponent,
    ExtensionSyncMenuComponent,
    ExtensionAppMoreMenuComponent
  ],
  providers: [
    { provide: AppLoadService, useClass: ExtensionLoadService },
    { provide: SYNC_BAR_COMPONENT, useValue: ExtensionSyncBarComponent },
    { provide: REFRESH_STATS_BAR_COMPONENT, useValue: ExtensionRefreshStatsBarComponent },
    { provide: SYNC_MENU_COMPONENT, useValue: ExtensionSyncMenuComponent },
    { provide: APP_MORE_MENU_COMPONENT, useValue: ExtensionAppMoreMenuComponent }
  ]
})
export class ExtensionBootModule {}

@NgModule({
  declarations: [
    AppLoadComponent,
    AppComponent,
    TopBarDirective,
    TopBarComponent,
    SyncBarDirective,
    SyncBarComponent,
    RefreshStatsBarDirective,
    RefreshStatsBarComponent,
    SyncMenuDirective,
    AppMoreMenuDirective,
    SyncMenuComponent,
    AppMoreMenuComponent
  ],
  imports: [
    environment.buildTarget === BuildTarget.DESKTOP ? DesktopBootModule : ExtensionBootModule,
    TargetBootModule, // TODO New module
    SharedModule
  ],
  providers: [{ provide: ErrorHandler, useClass: ElevateErrorHandler }],
  bootstrap: [AppLoadComponent]
})
export class AppModule {}
