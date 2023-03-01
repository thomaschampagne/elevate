import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutes } from "../../models/app-routes";

const routes: Routes = [
  {
    path: AppRoutes.goals,
    loadChildren: () => import("../../../desktop/goals/goals.module").then(module => module.GoalsModule)
  },
  {
    path: AppRoutes.dashboard,
    loadChildren: () => import("../../../desktop/dashboard/dashboard.module").then(module => module.DashboardModule)
  },
  {
    path: AppRoutes.activities,
    loadChildren: () => import("../../../activities/activities.module").then(module => module.ActivitiesModule)
  },
  {
    path: AppRoutes.activity,
    loadChildren: () =>
      import("../../../desktop/activity-view/activity-view.module").then(module => module.ActivityViewModule)
  },
  {
    path: AppRoutes.fitnessTrend,
    loadChildren: () => import("../../../fitness-trend/fitness-trend.module").then(module => module.FitnessTrendModule)
  },
  {
    path: AppRoutes.yearProgressions,
    loadChildren: () => import("../../../year-progress/year-progress.module").then(module => module.YearProgressModule)
  },
  {
    path: AppRoutes.heatMap,
    loadChildren: () => import("../../../heat-map/heat-map.module").then(module => module.HeatMapModule)
  },
  {
    path: AppRoutes.globalSettings,
    loadChildren: () =>
      import("../../../global-settings/global-settings.module").then(module => module.GlobalSettingsModule)
  },
  {
    path: AppRoutes.athleteSettings,
    loadChildren: () =>
      import("../../../athlete-settings/athlete-settings.module").then(module => module.AthleteSettingsModule)
  },
  {
    path: AppRoutes.zonesSettings,
    loadChildren: () =>
      import("../../../zones-settings/zones-settings.module").then(module => module.ZonesSettingsModule)
  },
  {
    path: AppRoutes.connectors,
    loadChildren: () => import("../../../desktop/connectors/connectors.module").then(module => module.ConnectorsModule)
  },
  {
    path: AppRoutes.donate,
    loadChildren: () => import("../../../donate/donate.module").then(module => module.DonateModule)
  },
  {
    path: AppRoutes.releasesNotes,
    loadChildren: () =>
      import("../../../releases-notes/releases-notes.module").then(module => module.ReleasesNotesModule)
  },
  {
    path: AppRoutes.report,
    loadChildren: () => import("../../../report/report.module").then(module => module.ReportModule)
  },
  {
    path: AppRoutes.advancedMenu,
    loadChildren: () =>
      import("../../../advanced-menu/desktop/desktop-advanced-menu.module").then(
        module => module.DesktopAdvancedMenuModule
      )
  },
  {
    path: AppRoutes.help,
    loadChildren: () => import("../../../help/help.module").then(module => module.HelpModule)
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
