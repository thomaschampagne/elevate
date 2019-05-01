import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { RouterModule, Routes } from "@angular/router";
import { ConnectorsComponent } from "./connectors.component";

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
	declarations: [ConnectorsComponent],
})
export class ConnectorsModule {
}
