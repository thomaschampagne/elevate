import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from "./app-routing.module";
import { AthleteSettingsComponent } from './athlete-settings/athlete-settings.component';
import { CommonSettingsComponent } from './common-settings/common-settings.component';
import { ChromeStorageService } from "./services/chrome-storage.service";
import { CommonSettingsService } from "./services/common-settings.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./material.module";
import { FormsModule } from "@angular/forms";
import { NgPipesModule } from 'ngx-pipes';
import { AsHtmlPipe } from "./pipes/as-html.pipe";
import { GotItDialogComponent } from "./dialogs/noop-dialog/got-it-dialog.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { OptionHelperDialogComponent } from "./common-settings/option-helper-dialog/option-helper-dialog.component";
import { HttpClientModule } from "@angular/common/http";
import { OptionHelperReaderService } from "./services/option-helper-reader.service";

@NgModule({
	declarations: [
		// Components
		AppComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent,

		// Pipes
		AsHtmlPipe,

		// Dialogs
		GotItDialogComponent,
		OptionHelperDialogComponent
	],
	entryComponents: [
		GotItDialogComponent,
		OptionHelperDialogComponent
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
		ChromeStorageService,
		CommonSettingsService,
		OptionHelperReaderService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
