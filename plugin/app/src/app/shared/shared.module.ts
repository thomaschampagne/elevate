import { NgModule } from "@angular/core";
import { AthleteSettingsComponent } from "../athlete-settings/athlete-settings.component";
import { GlobalSettingsComponent } from "../global-settings/global-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { SwimFtpHelperComponent } from "../athlete-settings/swim-ftp-helper/swim-ftp-helper.component";
import { ZonesImportExportDialogComponent } from "../zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ZoneToolBarComponent } from "../zones-settings/zone-tool-bar/zone-tool-bar.component";
import { GotItDialogComponent } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { ConfirmDialogComponent } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { OptionHelperDialogComponent } from "../global-settings/option-helper-dialog/option-helper-dialog.component";
import { UserSettingsService } from "./services/user-settings/user-settings.service";
import { GlobalSettingsService } from "../global-settings/services/global-settings.service";
import { ActivityService } from "./services/activity/activity.service";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { ActivityDao } from "./dao/activity/activity.dao";
import { OptionHelperReaderService } from "../global-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { AppRoutingModule } from "./modules/app-routing.module";
import { DonateComponent } from "../donate/donate.component";
import { ReleasesNotesComponent } from "../releases-notes/releases-notes.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { ReleasesNotesResolverService } from "../releases-notes/releases-notes-resolver.service";
import { WindowService } from "./services/window/window.service";
import { SideNavService } from "./services/side-nav/side-nav.service";
import { SyncDao } from "./dao/sync/sync.dao";
import { SyncService } from "./services/sync/sync.service";
import { ImportBackupDialogComponent } from "./dialogs/import-backup-dialog/import-backup-dialog.component";
import { ShareComponent } from "../share/share.component";
import { ReportComponent } from "../report/report.component";
import { CoreModule } from "../core/core.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { AdvancedMenuComponent } from "../advanced-menu/advanced-menu.component";
import { ExternalUpdatesService } from "./services/external-updates/external-updates.service";

@NgModule({
	imports: [
		CoreModule,
		BrowserModule,
		BrowserAnimationsModule,
		AppRoutingModule
	],
	exports: [
		CoreModule,
		BrowserModule,
		BrowserAnimationsModule,
		AppRoutingModule
	],
	declarations: [
		// Components
		AthleteSettingsComponent,
		GlobalSettingsComponent,
		SwimFtpHelperComponent,
		ZonesSettingsComponent,
		ZoneComponent,
		DonateComponent,
		ReleasesNotesComponent,
		ShareComponent,
		ReportComponent,
		AdvancedMenuComponent,

		// Dialogs
		ZoneToolBarComponent,
		GotItDialogComponent,
		ConfirmDialogComponent,
		OptionHelperDialogComponent,
		ZonesImportExportDialogComponent,
		AboutDialogComponent,
		ImportBackupDialogComponent
	],
	entryComponents: [
		GotItDialogComponent,
		ConfirmDialogComponent,
		OptionHelperDialogComponent,
		ZonesImportExportDialogComponent,
		AboutDialogComponent,
		ImportBackupDialogComponent
	],
	providers: [
		SyncService,
		SyncDao,
		UserSettingsService,
		UserSettingsDao,
		ActivityService,
		ActivityDao,
		GlobalSettingsService,
		OptionHelperReaderService,
		ZonesService,
		ReleasesNotesResolverService,
		SideNavService,
		WindowService,
		ExternalUpdatesService
	]
})
export class SharedModule {
}
