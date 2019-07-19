import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { RouterModule, Routes } from "@angular/router";
import { ConnectorsComponent } from "./connectors.component";
import { StravaConnectorComponent } from "./strava-connector/strava-connector.component";
import { StravaConnectorService } from "./services/strava-connector.service";

const routes: Routes = [
	{
		path: "",
		component: ConnectorsComponent
	}
];

@NgModule({
	imports: [
		CoreModule,
		RouterModule.forChild(routes)
	],
	declarations: [
		ConnectorsComponent,
		StravaConnectorComponent
	],
	providers: [
		StravaConnectorService
	]
})
export class ConnectorsModule {
}
