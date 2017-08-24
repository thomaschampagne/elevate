import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { AthleteSettingsComponent } from "../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../common-settings/common-settings.component";

export const routes = {
	commonSettings: 'commonSettings',
	athleteSettings: 'athleteSettings',
};

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot([
			{
				path: routes.commonSettings, component: CommonSettingsComponent
			},
			{
				path: routes.athleteSettings, component: AthleteSettingsComponent
			},
			{
				path: '',
				redirectTo: routes.athleteSettings,
				pathMatch: 'full'
			},
		], {useHash: true}),
	],
	exports: [
		RouterModule
	],
	declarations: []
})
export class RoutingModule {
}
