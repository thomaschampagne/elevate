import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "./modules/material.module";
import { NgPipesModule } from "ngx-pipes";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FlexLayoutModule } from "@angular/flex-layout";
import { AthleteSettingsComponent } from "../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { FitnessTrendGraphComponent } from "../fitness-trend/fitness-trend-graph/fitness-trend-graph.component";
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
import { FitnessService } from "../fitness-trend/shared/service/fitness.service";
import { OptionHelperReaderService } from "../common-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { AppRoutingModule } from "./modules/app-routing.module";
import { FitnessInfoDialogComponent } from "../fitness-trend/fitness-trend-graph/fitness-info-dialog/fitness-info-dialog.component";
import { FitnessTrendTableComponent } from "../fitness-trend/fitness-trend-table/fitness-trend-table.component";
import { FitnessTrendComponent } from "../fitness-trend/fitness-trend.component";
import { DonateComponent } from "../donate/donate.component";
import { ReleasesNotesComponent } from "../releases-notes/releases-notes.component";
import { YearProgressComponent } from "../year-progress/year-progress.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { ReleasesNotesResolverService } from "../releases-notes/releases-notes-resolver.service";
import { YearProgressResolverService } from "../year-progress/services/year-progress-resolver.service";

@NgModule({
	declarations: [

		// Components
		AthleteSettingsComponent,
		CommonSettingsComponent,
		SwimFtpHelperComponent,
		ZonesSettingsComponent,
		ZoneComponent,
		FitnessTrendComponent,
		FitnessTrendGraphComponent,
		FitnessTrendTableComponent,
		YearProgressComponent,
		DonateComponent,
		ReleasesNotesComponent,

		// Dialogs
		ZoneToolBarComponent,
		GotItDialogComponent,
		ConfirmDialogComponent,
		OptionHelperDialogComponent,
		ZonesImportExportDialogComponent,
		FitnessInfoDialogComponent, // TODO Move in a below module?!
		AboutDialogComponent

	],
	entryComponents: [

		GotItDialogComponent,
		ConfirmDialogComponent,
		OptionHelperDialogComponent,
		ZonesImportExportDialogComponent,
		FitnessInfoDialogComponent,
		AboutDialogComponent

	],
	providers: [

		UserSettingsService,
		UserSettingsDao,
		ActivityService,
		ActivityDao,
		FitnessService,
		CommonSettingsService,
		OptionHelperReaderService,
		ZonesService,
		ReleasesNotesResolverService,
		YearProgressResolverService,

	],
	imports: [

		FormsModule,
		AppRoutingModule,
		MaterialModule,
		BrowserAnimationsModule,
		FlexLayoutModule,
		NgPipesModule

	],
	exports: [

		FormsModule,
		AppRoutingModule,
		MaterialModule,
		BrowserAnimationsModule,
		FlexLayoutModule,
		NgPipesModule

	]

})
export class SharedModule {
}
