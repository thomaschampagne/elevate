import { NgModule } from "@angular/core";

import { DashboardRoutingModule } from "./dashboard-routing.module";
import { DashboardComponent } from "./dashboard.component";
import { CoreModule } from "../../core/core.module";

@NgModule({
  imports: [CoreModule, DashboardRoutingModule],
  declarations: [DashboardComponent]
})
export class DashboardModule {}
