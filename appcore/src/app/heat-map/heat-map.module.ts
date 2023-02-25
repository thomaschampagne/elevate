import { NgModule } from "@angular/core";
import { GlobalSettingsComponent } from "./heat-map.component";
import { CoreModule } from "../core/core.module";
import { HeatMapRoutingModule } from "./heat-map-routing.module";

@NgModule({
  imports: [CoreModule, HeatMapRoutingModule],
  declarations: [GlobalSettingsComponent]
})
export class HeatMapModule {}
