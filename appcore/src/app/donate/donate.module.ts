import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../core/core.module";
import { DonateComponent } from "./donate.component";

const routes: Routes = [
  {
    path: "",
    component: DonateComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [DonateComponent]
})
export class DonateModule {}
