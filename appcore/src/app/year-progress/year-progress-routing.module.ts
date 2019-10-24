import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { YearProgressComponent } from "./year-progress.component";

const routes: Routes = [
	{
		path: "",
		component: YearProgressComponent
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
export class YearProgressRoutingModule {
}
