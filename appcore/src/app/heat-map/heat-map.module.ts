import { NgModule } from "@angular/core";
import { HeatMapComponent } from "./heat-map.component";
import { CoreModule } from "../core/core.module";
import { HeatMapRoutingModule } from "./heat-map-routing.module";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@NgModule({
  imports: [CoreModule, HeatMapRoutingModule, MatProgressSpinnerModule],
  declarations: [HeatMapComponent]
})
export class HeatMapModule {}
