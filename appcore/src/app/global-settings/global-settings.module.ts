import { NgModule } from "@angular/core";
import { GlobalSettingsComponent } from "./global-settings.component";
import { CoreModule } from "../core/core.module";
import { GlobalSettingsRoutingModule } from "./global-settings-routing.module";

@NgModule({
  imports: [CoreModule, GlobalSettingsRoutingModule],
  declarations: [GlobalSettingsComponent]
})
export class GlobalSettingsModule {}
