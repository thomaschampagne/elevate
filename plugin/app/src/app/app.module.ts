import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";
import { RemoteAthleteMismatchComponent } from "./remote-athlete-mismatch/remote-athlete-mismatch.component";

@NgModule({

	declarations: [
		AppComponent,
		RemoteAthleteMismatchComponent
	],
	imports: [
		CoreModule,
		SharedModule
	],
	bootstrap: [
		AppComponent
	]

})
export class AppModule {
}
