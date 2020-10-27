import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppRoutes } from "../../models/app-routes";
import { ActivitiesComponent } from "../../../activities/activities.component";
import { GlobalSettingsComponent } from "../../../global-settings/global-settings.component";
import { ZonesSettingsComponent } from "../../../zones-settings/zones-settings.component";
import { DonateComponent } from "../../../donate/donate.component";
import { ShareComponent } from "../../../share/share.component";
import { ReportComponent } from "../../../report/report.component";
import { HelpComponent } from "../../../help/help.component";
import { ExtensionAdvancedMenuComponent } from "../../../advanced-menu/extension/extension-advanced-menu.component";

@NgModule({
  imports: [RouterModule.forRoot(ExtensionRoutingModule.provideRoutes(), { enableTracing: false, useHash: true })],
  exports: [RouterModule]
})
export class ExtensionRoutingModule {
  public static routes: Routes = [
    {
      path: AppRoutes.activities,
      component: ActivitiesComponent
    },
    {
      path: AppRoutes.fitnessTrend,
      loadChildren: () =>
        import("../../../fitness-trend/fitness-trend.module").then(module => module.FitnessTrendModule)
    },
    {
      path: AppRoutes.yearProgressions,
      loadChildren: () =>
        import("../../../year-progress/year-progress.module").then(module => module.YearProgressModule)
    },
    {
      path: AppRoutes.globalSettings,
      component: GlobalSettingsComponent
    },
    {
      path: AppRoutes.athleteSettings,
      loadChildren: () =>
        import("../../../athlete-settings/athlete-settings.module").then(module => module.AthleteSettingsModule)
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
      path: AppRoutes.donate,
      component: DonateComponent
    },
    {
      path: AppRoutes.releasesNotes,
      loadChildren: () =>
        import("../../../releases-notes/releases-notes.module").then(module => module.ReleasesNotesModule)
    },
    {
      path: AppRoutes.share,
      component: ShareComponent
    },
    {
      path: AppRoutes.report,
      component: ReportComponent
    },
    {
      path: AppRoutes.advancedMenu,
      component: ExtensionAdvancedMenuComponent
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

  public static provideRoutes(): Routes {
    return ExtensionRoutingModule.routes;
  }
}
