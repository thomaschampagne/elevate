import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ZonesSettingsComponent } from "./zones-settings.component";

const routes: Routes = [
  {
    path: "",
    component: ZonesSettingsComponent
  },
  {
    path: ":zoneValue",
    component: ZonesSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ZonesSettingsRoutingModule {}
