import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { AthleteSettingsRoutingModule } from "./athlete-settings-routing.module";
import { PeriodicAthleteSettingsManagerComponent } from "./components/periodic-athlete-settings-manager/periodic-athlete-settings-manager.component";
import { AthleteSettingsFormComponent } from "./components/athlete-settings-form/athlete-settings-form.component";
import { SwimFtpHelperComponent } from "./components/athlete-settings-form/swim-ftp-helper/swim-ftp-helper.component";
import { AthleteSettingsComponent } from "./components/athlete-settings.component";
import { EditPeriodicAthleteSettingsDialogComponent } from "./components/edit-periodic-athlete-settings-dialog/edit-periodic-athlete-settings-dialog.component";

@NgModule({
	imports: [
		CoreModule,
		AthleteSettingsRoutingModule
	],
	declarations: [
		AthleteSettingsComponent,
		AthleteSettingsFormComponent,
		PeriodicAthleteSettingsManagerComponent,
		SwimFtpHelperComponent,
		EditPeriodicAthleteSettingsDialogComponent
	],
	entryComponents: [
		EditPeriodicAthleteSettingsDialogComponent
	]
})
export class AthleteSettingsModule {
}
