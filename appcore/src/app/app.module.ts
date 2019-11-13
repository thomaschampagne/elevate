import { ErrorHandler, NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { AthleteSettingsConsistencyRibbonComponent } from "./athlete-settings-consistency-ribbon/athlete-settings-consistency-ribbon.component";
import { SYNC_MENU_COMPONENT_TOKEN, SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { EnvTarget } from "@elevate/shared/models";
import { environment } from "../environments/environment";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { DesktopSyncMenuComponent } from "./sync-menu/desktop/desktop-sync-menu.component";
import { ExtensionSyncMenuComponent } from "./sync-menu/extension/extension-sync-menu.component";
import { DesktopTopBarComponent, ExtensionTopBarComponent, TOP_BAR_COMPONENT_TOKEN, TopBarComponent } from "./top-bar/top-bar.component";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { ElevateErrorHandler } from "./elevate-error-handler";
import {
	DesktopSyncBarComponent,
	ExtensionSyncBarComponent,
	SYNC_BAR_COMPONENT_TOKEN,
	SyncBarComponent
} from "./sync-bar/sync-bar.component";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import { DesktopAppGuardDialogComponent } from "./desktop-app-guard/desktop-app-guard-dialog.component";
import { DesktopAppGuardActivator } from "./desktop-app-guard/desktop-app-guard-activator.service";
import { MENU_ITEMS_PROVIDER } from "./shared/services/menu-items/menu-items-provider.interface";
import { DesktopMenuItemsProvider } from "./shared/services/menu-items/impl/desktop-menu-items-provider.service";
import { ExtensionMenuItemsProvider } from "./shared/services/menu-items/impl/extension-menu-items-provider.service";


@NgModule({
	imports: [
		CoreModule
	],
	exports: [
		CoreModule
	],
	declarations: [
		DesktopSyncMenuComponent,
		DesktopSyncBarComponent,
		DesktopTopBarComponent,
		DesktopAppGuardDialogComponent
	],
	entryComponents: [
		DesktopSyncMenuComponent,
		DesktopSyncBarComponent,
		DesktopTopBarComponent,
		DesktopAppGuardDialogComponent
	],
	providers: [
		{provide: MENU_ITEMS_PROVIDER, useClass: DesktopMenuItemsProvider},
		{provide: TOP_BAR_COMPONENT_TOKEN, useValue: DesktopTopBarComponent},
		{provide: SYNC_BAR_COMPONENT_TOKEN, useValue: DesktopSyncBarComponent},
		{provide: SYNC_MENU_COMPONENT_TOKEN, useValue: DesktopSyncMenuComponent},
		DesktopAppGuardActivator
	]
})
export class DesktopBootModule {
}

@NgModule({
	imports: [
		CoreModule
	],
	exports: [
		CoreModule
	],
	declarations: [
		ExtensionTopBarComponent,
		ExtensionSyncBarComponent,
		ExtensionSyncMenuComponent
	],
	entryComponents: [
		ExtensionTopBarComponent,
		ExtensionSyncBarComponent,
		ExtensionSyncMenuComponent
	],
	providers: [
		{provide: MENU_ITEMS_PROVIDER, useClass: ExtensionMenuItemsProvider},
		{provide: TOP_BAR_COMPONENT_TOKEN, useValue: ExtensionTopBarComponent},
		{provide: SYNC_BAR_COMPONENT_TOKEN, useValue: ExtensionSyncBarComponent},
		{provide: SYNC_MENU_COMPONENT_TOKEN, useValue: ExtensionSyncMenuComponent},
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
		SyncMenuDirective,
		SyncMenuComponent,
		AthleteSettingsConsistencyRibbonComponent
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
