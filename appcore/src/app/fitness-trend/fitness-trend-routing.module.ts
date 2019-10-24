import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FitnessTrendComponent } from "./fitness-trend.component";

const routes: Routes = [
	{
		path: "",
		component: FitnessTrendComponent
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
export class FitnessTrendRoutingModule {
}
