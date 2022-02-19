import { NgModule } from "@angular/core";
import { GoalsRoutingModule } from "./goals-routing.module";
import { GoalsComponent } from "./goals.component";
import { CoreModule } from "../../core/core.module";

@NgModule({
  imports: [CoreModule, GoalsRoutingModule],
  declarations: [GoalsComponent]
})
export class GoalsModule {}
