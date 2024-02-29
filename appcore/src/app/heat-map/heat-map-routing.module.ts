import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HeatMapComponent } from "./heat-map.component";

const routes: Routes = [
  {
    path: "",
    component: HeatMapComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HeatMapRoutingModule {}
