import { NgModule } from "@angular/core";

import { AppComponent, DesktopAppComponent, ExtensionAppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { AthleteSettingsConsistencyRibbonComponent } from "./athlete-settings-consistency-ribbon/athlete-settings-consistency-ribbon.component";
import { EnvTarget } from "@elevate/shared/models";
import { environment } from "../environments/environment";

const TARGET_APP_COMPONENT = (environment.target === EnvTarget.DESKTOP) ? DesktopAppComponent : ExtensionAppComponent;

@NgModule({
	declarations: [
		AppComponent,
		TARGET_APP_COMPONENT,
		AthleteSettingsConsistencyRibbonComponent
	],
	imports: [
		CoreModule,
		SharedModule
	],
	bootstrap: [
		TARGET_APP_COMPONENT
	]
})
export class AppModule {
}
