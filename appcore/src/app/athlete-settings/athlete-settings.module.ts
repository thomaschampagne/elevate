import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { AthleteSettingsRoutingModule } from "./athlete-settings-routing.module";
import { DatedAthleteSettingsManagerComponent } from "./components/dated-athlete-settings-manager/dated-athlete-settings-manager.component";
import { AthleteSettingsFormComponent } from "./components/athlete-settings-form/athlete-settings-form.component";
import { SwimFtpHelperComponent } from "./components/athlete-settings-form/swim-ftp-helper/swim-ftp-helper.component";
import { AthleteSettingsComponent } from "./components/athlete-settings.component";
import { EditDatedAthleteSettingsDialogComponent } from "./components/edit-dated-athlete-settings-dialog/edit-dated-athlete-settings-dialog.component";

@NgModule({
	imports: [
		CoreModule,
		AthleteSettingsRoutingModule
	],
	declarations: [
		AthleteSettingsComponent,
		AthleteSettingsFormComponent,
		DatedAthleteSettingsManagerComponent,
		SwimFtpHelperComponent,
		EditDatedAthleteSettingsDialogComponent
	],
	entryComponents: [
		EditDatedAthleteSettingsDialogComponent
	]
})
export class AthleteSettingsModule {
}
