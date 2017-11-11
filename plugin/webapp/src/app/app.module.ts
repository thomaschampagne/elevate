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

@NgModule({
	declarations: [
		// Components
		AppComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent,

		// Pipes
		AsHtmlPipe,

		// Dialogs
		GotItDialogComponent
	],
	entryComponents: [
		GotItDialogComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		MaterialModule,
		BrowserAnimationsModule,
		NgPipesModule
	],
	providers: [ChromeStorageService, CommonSettingsService],
	bootstrap: [AppComponent]
})
export class AppModule {
}
