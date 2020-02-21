import { ErrorHandler, NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { SYNC_MENU_COMPONENT, SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { EnvTarget } from "@elevate/shared/models";
import { environment } from "../environments/environment";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { DesktopSyncMenuComponent } from "./sync-menu/desktop/desktop-sync-menu.component";
import { ExtensionSyncMenuComponent } from "./sync-menu/extension/extension-sync-menu.component";
import { DesktopTopBarComponent, ExtensionTopBarComponent, TOP_BAR_COMPONENT, TopBarComponent } from "./top-bar/top-bar.component";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { ElevateErrorHandler } from "./elevate-error-handler";
import { DesktopSyncBarComponent, ExtensionSyncBarComponent, SYNC_BAR_COMPONENT, SyncBarComponent } from "./sync-bar/sync-bar.component";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import { MENU_ITEMS_PROVIDER } from "./shared/services/menu-items/menu-items-provider.interface";
import { DesktopMenuItemsProvider } from "./shared/services/menu-items/impl/desktop-menu-items-provider.service";
import { ExtensionMenuItemsProvider } from "./shared/services/menu-items/impl/extension-menu-items-provider.service";
import { APP_MORE_MENU_COMPONENT, AppMoreMenuComponent, DesktopAppMoreMenuComponent, ExtensionAppMoreMenuComponent } from "./app-more-menu/app-more-menu.component";
import { AppMoreMenuDirective } from "./app-more-menu/app-more-menu.directive";
import { DesktopRoutingModule } from "./shared/modules/desktop/desktop-routing.module";
import { ExtensionRoutingModule } from "./shared/modules/extension/extension-routing.module";
import { DesktopPreRunGuard } from "./desktop/pre-run-guard/desktop-pre-run-guard.service";
import { DesktopPreRunGuardDialogComponent } from "./desktop/pre-run-guard/desktop-pre-run-guard-dialog.component";
import {
	DesktopRefreshStatsBarComponent,
	ExtensionRefreshStatsBarComponent,
	REFRESH_STATS_BAR_COMPONENT,
	RefreshStatsBarComponent
} from "./refresh-stats-bar/refresh-stats-bar.component";
import { RefreshStatsBarDirective } from "./refresh-stats-bar/refresh-stats-bar.directive";

@NgModule({
	imports: [
		CoreModule,
		DesktopRoutingModule
	],
	exports: [
		CoreModule,
		DesktopRoutingModule
	],
	declarations: [
		DesktopSyncMenuComponent,
		DesktopSyncBarComponent,
		DesktopRefreshStatsBarComponent,
		DesktopTopBarComponent,
		DesktopPreRunGuardDialogComponent,
		DesktopAppMoreMenuComponent
	],
	providers: [
		{provide: MENU_ITEMS_PROVIDER, useClass: DesktopMenuItemsProvider},
		{provide: TOP_BAR_COMPONENT, useValue: DesktopTopBarComponent},
		{provide: SYNC_BAR_COMPONENT, useValue: DesktopSyncBarComponent},
		{provide: REFRESH_STATS_BAR_COMPONENT, useValue: DesktopRefreshStatsBarComponent},
		{provide: SYNC_MENU_COMPONENT, useValue: DesktopSyncMenuComponent},
		{provide: APP_MORE_MENU_COMPONENT, useValue: DesktopAppMoreMenuComponent},
		DesktopPreRunGuard
	]
})
export class DesktopBootModule {
}

@NgModule({
	imports: [
		CoreModule,
		ExtensionRoutingModule
	],
	exports: [
		CoreModule,
		ExtensionRoutingModule
	],
	declarations: [
		ExtensionTopBarComponent,
		ExtensionSyncBarComponent,
		ExtensionRefreshStatsBarComponent,
		ExtensionSyncMenuComponent,
		ExtensionAppMoreMenuComponent
	],
	providers: [
		{provide: MENU_ITEMS_PROVIDER, useClass: ExtensionMenuItemsProvider},
		{provide: TOP_BAR_COMPONENT, useValue: ExtensionTopBarComponent},
		{provide: SYNC_BAR_COMPONENT, useValue: ExtensionSyncBarComponent},
		{provide: REFRESH_STATS_BAR_COMPONENT, useValue: ExtensionRefreshStatsBarComponent},
		{provide: SYNC_MENU_COMPONENT, useValue: ExtensionSyncMenuComponent},
		{provide: APP_MORE_MENU_COMPONENT, useValue: ExtensionAppMoreMenuComponent}
	]
})
export class ExtensionBootModule {
}

@NgModule({
	declarations: [
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
		(environment.target === EnvTarget.DESKTOP) ? DesktopBootModule : ExtensionBootModule,
		SharedModule,
	],
	providers: [{provide: ErrorHandler, useClass: ElevateErrorHandler}],
	bootstrap: [
		AppComponent
	]
})
export class AppModule {
}
