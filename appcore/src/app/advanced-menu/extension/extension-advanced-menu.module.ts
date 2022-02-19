import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../../core/core.module";
import { ExtensionAdvancedMenuComponent } from "./extension-advanced-menu.component";

const routes: Routes = [
  {
    path: "",
    component: ExtensionAdvancedMenuComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [ExtensionAdvancedMenuComponent]
})
export class ExtensionAdvancedMenuModule {}
