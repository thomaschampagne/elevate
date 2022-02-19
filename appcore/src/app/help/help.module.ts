import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { RouterModule, Routes } from "@angular/router";
import { HelpComponent } from "./help.component";

const routes: Routes = [
  {
    path: "",
    component: HelpComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [HelpComponent]
})
export class HelpModule {}
