import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AthleteSettingsComponent } from "./components/athlete-settings.component";

const routes: Routes = [
	{
		path: "",
		component: AthleteSettingsComponent
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(routes)
	],
	exports: [
		RouterModule
	]
})
export class AthleteSettingsRoutingModule {
}
