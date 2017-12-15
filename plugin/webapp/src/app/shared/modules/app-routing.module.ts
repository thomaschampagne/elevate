import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutesModel } from "../models/app-routes.model";
import { AthleteSettingsComponent } from "../../athlete-settings/athlete-settings.component";
import { CommonSettingsComponent } from "../../common-settings/common-settings.component";
import { ZonesSettingsComponent } from "../../zones-settings/zones-settings.component";
import { FitnessTrendComponent } from "../../fitness-trend/fitness-trend.component";
import { DonateComponent } from "../../donate/donate.component";
import { ReleasesNotesComponent } from "../../releases-notes/releases-notes.component";
import { ReleasesNotesResolverService } from "../../releases-notes/releases-notes-resolver.service";
import { YearProgressComponent } from "../../year-progress/year-progress.component";

export const routes: Routes = [
	{
		path: AppRoutesModel.fitnessTrend,
		component: FitnessTrendComponent
	},
	{
		path: AppRoutesModel.yearProgress,
		component: YearProgressComponent
	},
	{
		path: AppRoutesModel.commonSettings,
		component: CommonSettingsComponent
	},
	{
		path: AppRoutesModel.athleteSettings,
		component: AthleteSettingsComponent
	},
	{
		path: AppRoutesModel.zonesSettings,
		component: ZonesSettingsComponent
	},
	{
		path: AppRoutesModel.zonesSettings + "/:zoneValue",
		component: ZonesSettingsComponent
	},
	{
		path: "", redirectTo: AppRoutesModel.commonSettings, pathMatch: "full"
	},
	{
		path: AppRoutesModel.donate,
		component: DonateComponent
	},
	{
		path: AppRoutesModel.releasesNotes,
		component: ReleasesNotesComponent,
		resolve: {
			releasesNotes: ReleasesNotesResolverService
		}
	},
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
