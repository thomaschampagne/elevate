import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { RouterModule, Routes } from "@angular/router";
import { ConnectorsComponent } from "./connectors.component";
import { StravaConnectorComponent } from "./strava-connector/strava-connector.component";
import { StravaConnectorService } from "./strava-connector/strava-connector.service";
import { FileSystemConnectorComponent } from "./file-system-connector/file-system-connector.component";
import { FileConnectorService } from "./file-system-connector/file-connector.service";

const routes: Routes = [
  {
    path: "",
    component: ConnectorsComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [ConnectorsComponent, StravaConnectorComponent, FileSystemConnectorComponent],
  providers: [StravaConnectorService, FileConnectorService]
})
export class ConnectorsModule {}
