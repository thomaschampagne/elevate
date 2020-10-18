import { NgModule } from "@angular/core";
import { MENU_ITEMS_PROVIDER } from "../shared/services/menu-items/menu-items-provider.interface";
import { ExtensionMenuItemsProvider } from "../shared/services/menu-items/impl/extension-menu-items-provider.service";
import { SharedModule } from "../shared/shared.module";
import { TOP_BAR_COMPONENT } from "../top-bar/top-bar.component";
import { ExtensionTopBarComponent } from "../top-bar/extension-top-bar.component";

@NgModule({
  imports: [SharedModule],
  declarations: [ExtensionTopBarComponent],
  providers: [
    { provide: MENU_ITEMS_PROVIDER, useClass: ExtensionMenuItemsProvider },
    { provide: TOP_BAR_COMPONENT, useValue: ExtensionTopBarComponent }
  ]
})
export class TargetBootModule {}
