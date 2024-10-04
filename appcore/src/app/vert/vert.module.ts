import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../core/core.module";
import { VertComponent } from "./vert.component";

const routes: Routes = [
  {
    path: "",
    component: VertComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [VertComponent]
})
export class VertModule {}
