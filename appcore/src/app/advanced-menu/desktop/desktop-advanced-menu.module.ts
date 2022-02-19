import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../../core/core.module";
import { DesktopAdvancedMenuComponent } from "./desktop-advanced-menu.component";

const routes: Routes = [
  {
    path: "",
    component: DesktopAdvancedMenuComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [DesktopAdvancedMenuComponent]
})
export class DesktopAdvancedMenuModule {}
