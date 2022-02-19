import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { ActivityViewComponent } from "./activity-view.component";

const routes: Routes = [
  {
    path: ":id",
    component: ActivityViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivityViewRoutingModule {}
