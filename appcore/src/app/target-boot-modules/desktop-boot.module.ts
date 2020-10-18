import { NgModule } from "@angular/core";
import { MENU_ITEMS_PROVIDER } from "../shared/services/menu-items/menu-items-provider.interface";
import { DesktopMenuItemsProvider } from "../shared/services/menu-items/impl/desktop-menu-items-provider.service";
import { TOP_BAR_COMPONENT } from "../top-bar/top-bar.component";
import { SharedModule } from "../shared/shared.module";
import { DesktopTopBarComponent } from "../top-bar/desktop-top-bar.component";

@NgModule({
  imports: [SharedModule],
  declarations: [DesktopTopBarComponent],
  providers: [
    { provide: MENU_ITEMS_PROVIDER, useClass: DesktopMenuItemsProvider },
    { provide: TOP_BAR_COMPONENT, useValue: DesktopTopBarComponent }
  ]
})
export class TargetBootModule {}
