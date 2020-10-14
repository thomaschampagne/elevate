import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ReleasesNotesComponent } from "./releases-notes.component";

const routes: Routes = [
  {
    path: "",
    component: ReleasesNotesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReleasesNotesRoutingModule {}
