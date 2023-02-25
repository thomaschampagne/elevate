import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GlobalSettingsComponent } from "./heat-map.component";

const routes: Routes = [
  {
    path: "",
    component: GlobalSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HeatMapRoutingModule {}
