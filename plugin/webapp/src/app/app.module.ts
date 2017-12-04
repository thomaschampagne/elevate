import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SharedModule } from "./shared/shared.module";
import { AppRoutingModule } from "./shared/modules/app-routing.module";

@NgModule({

	imports: [
		SharedModule,
		AppRoutingModule
	],
	bootstrap: [
		AppComponent
	]

})
export class AppModule {
}
