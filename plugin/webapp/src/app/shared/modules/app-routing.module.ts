import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutesModel } from "../models/app-routes.model";
import { AthleteSettingsComponent } from "../../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../../zones-settings/zones-settings.component";
import { FitnessTrendComponent } from "../../fitness-trend/fitness-trend.component";
import { YearProgressComponent } from "../../year-progress/year-progress.component";

export const routes: Routes = [
	{path: AppRoutesModel.fitnessTrend, component: FitnessTrendComponent},
	{path: AppRoutesModel.commonSettings, component: CommonSettingsComponent},
	{path: AppRoutesModel.athleteSettings, component: AthleteSettingsComponent},
	{path: AppRoutesModel.zonesSettings, component: ZonesSettingsComponent},
	{path: AppRoutesModel.zonesSettings + "/:zoneValue", component: ZonesSettingsComponent},
	{path: AppRoutesModel.yearProgress, component: YearProgressComponent},
	{path: "", redirectTo: AppRoutesModel.commonSettings, pathMatch: "full"},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {enableTracing: false, useHash: true})
	],
	exports: [
		RouterModule
	]
})
export class AppRoutingModule {
}
