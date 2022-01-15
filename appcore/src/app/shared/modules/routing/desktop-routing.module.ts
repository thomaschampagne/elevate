import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutes } from "../../models/app-routes";
import { ActivitiesComponent } from "../../../activities/activities.component";
import { GlobalSettingsComponent } from "../../../global-settings/global-settings.component";
import { DonateComponent } from "../../../donate/donate.component";
import { ReportComponent } from "../../../report/report.component";
import { DesktopAdvancedMenuComponent } from "../../../advanced-menu/desktop/desktop-advanced-menu.component";
import { HelpComponent } from "../../../help/help.component";
import { ZonesSettingsComponent } from "../../../zones-settings/zones-settings.component";
import { ActivityViewModule } from "../../../desktop/activity-view/activity-view.module";
import { FitnessTrendModule } from "../../../fitness-trend/fitness-trend.module";
import { AthleteSettingsModule } from "../../../athlete-settings/athlete-settings.module";
import { YearProgressModule } from "../../../year-progress/year-progress.module";
import { ReleasesNotesModule } from "../../../releases-notes/releases-notes.module";
import { ConnectorsModule } from "../../../connectors/connectors.module";
import { DashboardModule } from "../../../desktop/dashboard/dashboard.module";
import { GoalsModule } from "../../../desktop/goals/goals.module";

const routes: Routes = [
  {
    path: AppRoutes.goals,
    loadChildren: () => GoalsModule
  },
  {
    path: AppRoutes.dashboard,
    loadChildren: () => DashboardModule
  },
  {
    path: AppRoutes.activities,
    component: ActivitiesComponent
  },
  {
    path: AppRoutes.activity,
    loadChildren: () => ActivityViewModule
  },
  {
    path: AppRoutes.fitnessTrend,
    loadChildren: () => FitnessTrendModule
  },
  {
    path: AppRoutes.yearProgressions,
    loadChildren: () => YearProgressModule
  },
  {
    path: AppRoutes.globalSettings,
    component: GlobalSettingsComponent
  },
  {
    path: AppRoutes.athleteSettings,
    loadChildren: () => AthleteSettingsModule
  },
  {
    path: AppRoutes.zonesSettings,
    component: ZonesSettingsComponent
  },
  {
    path: AppRoutes.zonesSettings + "/:zoneValue",
    component: ZonesSettingsComponent
  },
  {
    path: AppRoutes.connectors,
    loadChildren: () => ConnectorsModule
  },
  {
    path: AppRoutes.donate,
    component: DonateComponent
  },
  {
    path: AppRoutes.releasesNotes,
    loadChildren: () => ReleasesNotesModule
  },
  {
    path: AppRoutes.report,
    component: ReportComponent
  },
  {
    path: AppRoutes.advancedMenu,
    component: DesktopAdvancedMenuComponent
  },
  {
    path: AppRoutes.help,
    component: HelpComponent
  },
  {
    path: "",
    redirectTo: AppRoutes.activities,
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false, useHash: true })],
  exports: [RouterModule]
})
export class DesktopRoutingModule {}
