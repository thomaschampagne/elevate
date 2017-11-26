import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from "./app-routing.module";
import { AthleteSettingsComponent } from './athlete-settings/athlete-settings.component';
import { CommonSettingsComponent } from './common-settings/common-settings.component';
import { UserSettingsService } from "./services/user-settings/user-settings.service";
import { CommonSettingsService } from "./services/common-settings/common-settings.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./material.module";
import { FormsModule } from "@angular/forms";
import { NgPipesModule } from 'ngx-pipes';
import { GotItDialog } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { OptionHelperDialog } from "./common-settings/option-helper-dialog/option-helper-dialog.component";
import { HttpClientModule } from "@angular/common/http";
import { OptionHelperReaderService } from "./services/option-helper-reader/option-helper-reader.service";
import { SwimFtpHelperComponent } from "./athlete-settings/swim-ftp-helper/swim-ftp-helper.component";
import { ZonesSettingsComponent } from "./zones-settings/zones-settings.component";
import { ZoneComponent } from "./zones-settings/zone/zone.component";
import { ZoneToolBarComponent } from "./zones-settings/zone-tool-bar/zone-tool-bar.component";
import { ZonesService } from "./services/zones/zones.service";
import { ZonesImportExportDialog } from "./zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ConfirmDialog } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { ActivityService } from "./services/activity/activity.service";
import { ActivityDao } from "./dao/activity/activity.dao";
import { FitnessService } from "./services/fitness/fitness.service";
import { FitnessTrendComponent } from './fitness-trend/fitness-trend.component';

@NgModule({
	declarations: [

		/**
		 * Components
		 */
		AppComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent,
		SwimFtpHelperComponent,
		ZonesSettingsComponent,
		ZoneComponent,
		FitnessTrendComponent,

		/**
		 * Dialogs
		 */
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
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		AppRoutingModule,
		MaterialModule,
		BrowserAnimationsModule,
		FlexLayoutModule,
		NgPipesModule
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
	bootstrap: [AppComponent]
})
export class AppModule {
}
