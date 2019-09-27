import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutesModel } from "../models/app-routes.model";
import { GlobalSettingsComponent } from "../../global-settings/global-settings.component";
import { ZonesSettingsComponent } from "../../zones-settings/zones-settings.component";
import { DonateComponent } from "../../donate/donate.component";
import { ShareComponent } from "../../share/share.component";
import { ReportComponent } from "../../report/report.component";
import { AdvancedMenuComponent } from "../../advanced-menu/advanced-menu.component";
import { FaqComponent } from "../../faq/faq.component";
import { ActivitiesComponent } from "../../activities/activities.component";

const routes: Routes = [
	{
		path: AppRoutesModel.activities,
		component: ActivitiesComponent
	},
	{
		path: AppRoutesModel.fitnessTrend,
		loadChildren: () => import("../../fitness-trend/fitness-trend.module").then(m => m.FitnessTrendModule)
	},
	{
		path: AppRoutesModel.yearProgressions,
		loadChildren: () => import("../../year-progress/year-progress.module").then(m => m.YearProgressModule)
	},
	{
		path: AppRoutesModel.globalSettings,
		component: GlobalSettingsComponent
	},
	{
		path: AppRoutesModel.athleteSettings,
		loadChildren: () => import("../../athlete-settings/athlete-settings.module").then(m => m.AthleteSettingsModule)
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
		path: AppRoutesModel.connectors,
		loadChildren: () => import("../../connectors/connectors.module").then(m => m.ConnectorsModule)
	},
	{
		path: AppRoutesModel.donate,
		component: DonateComponent
	},
	{
		path: AppRoutesModel.releasesNotes,
		loadChildren: () => import("../../releases-notes/releases-notes.module").then(m => m.ReleasesNotesModule)
	},
	{
		path: AppRoutesModel.share,
		component: ShareComponent
	},
	{
		path: AppRoutesModel.report,
		component: ReportComponent
	},
	{
		path: AppRoutesModel.advancedMenu,
		component: AdvancedMenuComponent
	},
	{
		path: AppRoutesModel.frequentlyAskedQuestions,
		component: FaqComponent
	},
	{
		path: "", redirectTo: AppRoutesModel.activities, pathMatch: "full"
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
