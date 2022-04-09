import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DownloadDesktopAppComponent } from "./download-desktop-app.component";

const routes: Routes = [
  {
    path: "",
    component: DownloadDesktopAppComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadDesktopAppRoutingModule {}
