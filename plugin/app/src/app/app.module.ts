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


@NgModule({
	imports: [
		CoreModule
	],
	exports: [
		CoreModule
	],
	declarations: [
		DesktopSyncMenuComponent,
		DesktopTopBarComponent
	],
	entryComponents: [
		DesktopSyncMenuComponent,
		DesktopTopBarComponent
	],
	providers: [
		{provide: TOP_BAR_COMPONENT_TOKEN, useValue: DesktopTopBarComponent},
		{provide: SYNC_MENU_COMPONENT_TOKEN, useValue: DesktopSyncMenuComponent},
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
		ExtensionSyncMenuComponent,
		ExtensionTopBarComponent
	],
	entryComponents: [
		ExtensionSyncMenuComponent,
		ExtensionTopBarComponent
	],
	providers: [
		{provide: TOP_BAR_COMPONENT_TOKEN, useValue: ExtensionTopBarComponent},
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
