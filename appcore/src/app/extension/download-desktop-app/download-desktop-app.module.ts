import { NgModule } from "@angular/core";
import { DownloadDesktopAppComponent } from "./download-desktop-app.component";
import { DownloadDesktopAppRoutingModule } from "./download-desktop-app-routing.module";
import { CoreModule } from "../../core/core.module";

@NgModule({
  imports: [CoreModule, DownloadDesktopAppRoutingModule],
  declarations: [DownloadDesktopAppComponent]
})
export class DownloadDesktopAppModule {}
