import { NgModule } from "@angular/core";
import { CoreModule } from "../../core/core.module";
import { RouterModule, Routes } from "@angular/router";
import { ConnectorsComponent } from "./connectors.component";
import { StravaConnectorComponent } from "./strava-connector/strava-connector.component";
import { StravaConnectorService } from "./strava-connector/strava-connector.service";
import { FileConnectorComponent } from "./file-connector/file-connector.component";
import { FileConnectorService } from "./file-connector/file-connector.service";
import { GarminConnectorComponent } from "./garmin-connector/garmin-connector.component";
import { GarminConnectorService } from "./garmin-connector/garmin-connector.service";
import { ReactiveFormsModule } from "@angular/forms";

const routes: Routes = [
  {
    path: "",
    component: ConnectorsComponent
  }
];

@NgModule({
  imports: [CoreModule, ReactiveFormsModule, RouterModule.forChild(routes)],
  declarations: [ConnectorsComponent, StravaConnectorComponent, FileConnectorComponent, GarminConnectorComponent],
  providers: [StravaConnectorService, FileConnectorService, GarminConnectorService]
})
export class ConnectorsModule {}
