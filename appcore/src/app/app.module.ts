import { ErrorHandler, NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { BuildTarget } from "@elevate/shared/enums";
import { environment } from "../environments/environment";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { TopBarComponent } from "./top-bar/top-bar.component";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { ElevateErrorHandler } from "./elevate-error-handler";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import { AppMoreMenuComponent } from "./app-more-menu/app-more-menu.component";
import { AppMoreMenuDirective } from "./app-more-menu/app-more-menu.directive";
import { DesktopRoutingModule } from "./shared/modules/desktop/desktop-routing.module";
import { ExtensionRoutingModule } from "./shared/modules/extension/extension-routing.module";
import { DesktopUnauthorizedMachineIdDialogComponent } from "./app-load/desktop/desktop-unauthorized-machine-id-dialog/desktop-unauthorized-machine-id-dialog.component";
import { RefreshStatsBarComponent } from "./refresh-stats-bar/refresh-stats-bar.component";
import { RefreshStatsBarDirective } from "./refresh-stats-bar/refresh-stats-bar.directive";
import { DesktopErrorsSyncDetailsDialogComponent } from "./sync-bar/desktop-errors-sync-details-dialog.component";
import { AppLoadComponent } from "./app-load/app-load.component";
import { TargetBootModule } from "./target-boot-modules/target-boot.module";
import { SyncBarComponent } from "./sync-bar/sync-bar.component";

@NgModule({
  imports: [CoreModule, DesktopRoutingModule],
  exports: [CoreModule, DesktopRoutingModule],
  declarations: [DesktopErrorsSyncDetailsDialogComponent, DesktopUnauthorizedMachineIdDialogComponent],
  providers: []
})
export class DesktopBootModule {} // TODO Delete

@NgModule({
  imports: [CoreModule, ExtensionRoutingModule],
  exports: [CoreModule, ExtensionRoutingModule],
  declarations: [],
  providers: []
})
export class ExtensionBootModule {} // TODO Delete

@NgModule({
  declarations: [
    AppLoadComponent,
    AppComponent,
    TopBarDirective,
    TopBarComponent, // TODO Try remove from declaration
    SyncBarDirective,
    SyncBarComponent, // TODO Try remove from declaration
    RefreshStatsBarDirective,
    RefreshStatsBarComponent, // TODO Try remove from declaration
    SyncMenuDirective,
    AppMoreMenuDirective,
    SyncMenuComponent, // TODO Try remove from declaration
    AppMoreMenuComponent // TODO Try remove from declaration
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
