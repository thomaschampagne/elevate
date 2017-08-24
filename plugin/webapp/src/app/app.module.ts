import "hammerjs";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./shared/material.module";
import { FlexLayoutModule } from "@angular/flex-layout";

import { AppComponent } from "./app.component";
import { AthleteSettingsComponent } from './athlete-settings/athlete-settings.component';
import { CommonSettingsComponent } from './common-settings/common-settings.component';
import { RoutingModule } from "./shared/routing.module";


@NgModule({
	imports: [
		BrowserModule,
		RoutingModule,
		BrowserAnimationsModule,
		MaterialModule,
		FlexLayoutModule
	],
	declarations: [AppComponent, AthleteSettingsComponent, CommonSettingsComponent],
	bootstrap: [AppComponent]
})
export class AppModule {
}
