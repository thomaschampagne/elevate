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

@NgModule({
	declarations: [
		AppComponent,
		AthleteSettingsComponent,
		CommonSettingsComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		AppRoutingModule
	],
	providers: [ChromeStorageService, CommonSettingsService],
	bootstrap: [AppComponent]
})
export class AppModule {
}
