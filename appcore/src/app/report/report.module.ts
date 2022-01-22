import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../core/core.module";
import { ReportComponent } from "./report.component";

const routes: Routes = [
  {
    path: "",
    component: ReportComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [ReportComponent]
})
export class ReportModule {}
