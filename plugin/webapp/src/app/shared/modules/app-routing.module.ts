import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutesModel } from "../models/app-routes.model";
import { AthleteSettingsComponent } from "../../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../../zones-settings/zones-settings.component";
import { FitnessTrendGraphComponent } from "../../fitness-trend/graph/fitness-trend-graph.component";

export const routes: Routes = [
	{path: AppRoutesModel.fitnessTrend, component: FitnessTrendGraphComponent},
	{path: AppRoutesModel.commonSettings, component: CommonSettingsComponent},
	{path: AppRoutesModel.athleteSettings, component: AthleteSettingsComponent},
	{path: AppRoutesModel.zonesSettings, component: ZonesSettingsComponent},
	{path: AppRoutesModel.zonesSettings + "/:zoneValue", component: ZonesSettingsComponent},
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
