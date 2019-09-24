import { NgModule } from "@angular/core";

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


@NgModule({
	imports: [
		CoreModule
	],
	exports: [
		CoreModule
	],
	declarations: [
		DesktopSyncMenuComponent
	],
	entryComponents: [
		DesktopSyncMenuComponent
	],
	providers: [
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
		ExtensionSyncMenuComponent
	],
	entryComponents: [
		ExtensionSyncMenuComponent
	],
	providers: [
		{provide: SYNC_MENU_COMPONENT_TOKEN, useValue: ExtensionSyncMenuComponent},
	]
})
export class ExtensionBootModule {
}

@NgModule({
	declarations: [
		AppComponent,
		SyncMenuDirective,
		SyncMenuComponent,
		AthleteSettingsConsistencyRibbonComponent
	],
	imports: [
		(environment.target === EnvTarget.DESKTOP) ? DesktopBootModule : ExtensionBootModule,
		SharedModule,
	],
	bootstrap: [
		AppComponent
	]
})
export class AppModule {
}
