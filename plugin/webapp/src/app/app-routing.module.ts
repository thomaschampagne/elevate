import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from "./app-routes";
import { AthleteSettingsComponent } from "./athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "./common-settings/common-settings.component";

const routes: Routes = [
	{
		path: appRoutes.athleteSettings,
		component: AthleteSettingsComponent,
	},
	{
		path: appRoutes.commonSettings,
		component: CommonSettingsComponent,
	},
	{
		path: '',
		redirectTo: appRoutes.commonSettings,
		pathMatch: 'full'
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {enableTracing: false, useHash: true})
	],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
