import { NgModule } from "@angular/core";
import { ActivitiesComponent } from "./activities.component";
import { CoreModule } from "../core/core.module";
import { ActivitiesRoutingModule } from "./activities-routing.module";

@NgModule({
  imports: [CoreModule, ActivitiesRoutingModule],
  declarations: [ActivitiesComponent]
})
export class ActivitiesModule {}
