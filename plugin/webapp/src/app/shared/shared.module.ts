import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { MaterialModule } from "./modules/material.module";
import { MatNativeDateModule } from "@angular/material";
import { NgPipesModule } from "ngx-pipes";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FlexLayoutModule } from "@angular/flex-layout";
import { AppComponent } from "../app.component";
import { AthleteSettingsComponent } from "../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { FitnessTrendGraphComponent } from "../fitness-trend/graph/fitness-trend-graph.component";
import { SwimFtpHelperComponent } from "../athlete-settings/swim-ftp-helper/swim-ftp-helper.component";
import { ZonesImportExportDialog } from "../zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ZoneToolBarComponent } from "../zones-settings/zone-tool-bar/zone-tool-bar.component";
import { GotItDialog } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { ConfirmDialog } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { OptionHelperDialog } from "../common-settings/option-helper-dialog/option-helper-dialog.component";
import { UserSettingsService } from "./services/user-settings/user-settings.service";
import { CommonSettingsService } from "../common-settings/services/common-settings.service";
import { ActivityService } from "./services/activity/activity.service";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { ActivityDao } from "./dao/activity/activity.dao";
import { FitnessService } from "../fitness-trend/shared/service/fitness.service";
import { OptionHelperReaderService } from "../common-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { AppRoutingModule } from "./modules/app-routing.module";

@NgModule({
	declarations: [

		// Components
		AppComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent,
		SwimFtpHelperComponent,
		ZonesSettingsComponent,
		ZoneComponent,
		FitnessTrendGraphComponent,

		// Dialogs
		ZoneToolBarComponent,
		GotItDialog,
		ConfirmDialog,
		OptionHelperDialog,
		ZonesImportExportDialog
	],
	entryComponents: [

		GotItDialog,
		ConfirmDialog,
		OptionHelperDialog,
		ZonesImportExportDialog

	],
	providers: [

		UserSettingsService,
		UserSettingsDao,
		ActivityService,
		ActivityDao,
		FitnessService,
		CommonSettingsService,
		OptionHelperReaderService,
		ZonesService

	],
	imports: [

		CommonModule,
		AppRoutingModule,
		BrowserModule,
		FormsModule,
		HttpClientModule,
		MaterialModule,
		MatNativeDateModule,
		BrowserAnimationsModule,
		FlexLayoutModule,
		NgPipesModule

	],
	exports: [

		CommonModule,
		AppRoutingModule,
		BrowserModule,
		FormsModule,
		HttpClientModule,
		MaterialModule,
		MatNativeDateModule,
		BrowserAnimationsModule,
		FlexLayoutModule,
		NgPipesModule

	]

})
export class SharedModule {
}
