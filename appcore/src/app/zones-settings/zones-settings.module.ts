import { NgModule } from "@angular/core";
import { ZonesSettingsComponent } from "./zones-settings.component";
import { ZoneComponent } from "./zone/zone.component";
import { CoreModule } from "../core/core.module";
import { ZonesSettingsRoutingModule } from "./zones-settings-routing.module";
import { ZoneToolBarComponent } from "./zone-tool-bar/zone-tool-bar.component";
import { ZonesImportExportDialogComponent } from "./zones-import-export-dialog/zones-import-export-dialog.component";
import { ZonesService } from "./shared/zones.service";

@NgModule({
  imports: [CoreModule, ZonesSettingsRoutingModule],
  declarations: [ZonesSettingsComponent, ZoneComponent, ZoneToolBarComponent, ZonesImportExportDialogComponent],
  providers: [ZonesService]
})
export class ZonesSettingsModule {}
