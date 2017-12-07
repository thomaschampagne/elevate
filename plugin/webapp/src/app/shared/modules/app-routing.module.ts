import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutes } from "./app-routes.model";
import { AthleteSettingsComponent } from "../../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../../zones-settings/zones-settings.component";
import { FitnessTrendGraphComponent } from "../../fitness-trend/graph/fitness-trend-graph.component";

export const routes: Routes = [
	{path: AppRoutes.fitnessTrend, component: FitnessTrendGraphComponent},
	{path: AppRoutes.commonSettings, component: CommonSettingsComponent},
	{path: AppRoutes.athleteSettings, component: AthleteSettingsComponent},
	{path: AppRoutes.zonesSettings, component: ZonesSettingsComponent},
	{path: AppRoutes.zonesSettings + "/:zoneValue", component: ZonesSettingsComponent},
	{path: "", redirectTo: AppRoutes.commonSettings, pathMatch: "full"},
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
