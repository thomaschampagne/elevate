import { NgModule } from "@angular/core";
import { AthleteSettingsComponent } from "../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { SwimFtpHelperComponent } from "../athlete-settings/swim-ftp-helper/swim-ftp-helper.component";
import { ZonesImportExportDialogComponent } from "../zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ZoneToolBarComponent } from "../zones-settings/zone-tool-bar/zone-tool-bar.component";
import { GotItDialogComponent } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { ConfirmDialogComponent } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { OptionHelperDialogComponent } from "../common-settings/option-helper-dialog/option-helper-dialog.component";
import { UserSettingsService } from "./services/user-settings/user-settings.service";
import { CommonSettingsService } from "../common-settings/services/common-settings.service";
import { ActivityService } from "./services/activity/activity.service";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { ActivityDao } from "./dao/activity/activity.dao";
import { OptionHelperReaderService } from "../common-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { AppRoutingModule } from "./modules/app-routing.module";
import { DonateComponent } from "../donate/donate.component";
import { ReleasesNotesComponent } from "../releases-notes/releases-notes.component";
import { YearProgressComponent } from "../year-progress/year-progress.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { ReleasesNotesResolverService } from "../releases-notes/releases-notes-resolver.service";
import { WindowService } from "./services/window/window.service";
import { SideNavService } from "./services/side-nav/side-nav.service";
import { YearProgressGraphComponent } from "../year-progress/year-progress-graph/year-progress-graph.component";
import { YearProgressTableComponent } from "../year-progress/year-progress-table/year-progress-table.component";
import { YearProgressHelperDialogComponent } from "../year-progress/year-progress-helper-dialog/year-progress-helper-dialog.component";
import { AthleteHistoryDao } from "./dao/athlete-history/athlete-history.dao";
import { AthleteHistoryService } from "./services/athlete-history/athlete-history.service";
import { AthleteHistoryImportDialogComponent } from "./dialogs/athlete-history-import-dialog/athlete-history-import-dialog.component";
import { ShareComponent } from "../share/share.component";
import { WelcomeComponent } from "../welcome/welcome.component";
import { ReportComponent } from "../report/report.component";
import { CoreModule } from "../core/core.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { AdvancedMenuComponent } from "../advanced-menu/advanced-menu.component";

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
		WelcomeComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent,
		SwimFtpHelperComponent,
		ZonesSettingsComponent,
		ZoneComponent,
		YearProgressComponent,
		YearProgressGraphComponent,
		YearProgressTableComponent,
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
		YearProgressHelperDialogComponent,
		AboutDialogComponent,
		AthleteHistoryImportDialogComponent,
	],
	entryComponents: [
		GotItDialogComponent,
		ConfirmDialogComponent,
		OptionHelperDialogComponent,
		ZonesImportExportDialogComponent,
		YearProgressHelperDialogComponent,
		AboutDialogComponent,
		AthleteHistoryImportDialogComponent
	],
	providers: [
		AthleteHistoryService,
		AthleteHistoryDao,
		UserSettingsService,
		UserSettingsDao,
		ActivityService,
		ActivityDao,
		CommonSettingsService,
		OptionHelperReaderService,
		ZonesService,
		ReleasesNotesResolverService,
		SideNavService,
		WindowService
	]
})
export class SharedModule {
}
