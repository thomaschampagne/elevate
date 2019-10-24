import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { ReleasesNotesComponent } from "./releases-notes.component";
import { ReleasesNotesResolverService } from "./releases-notes-resolver.service";
import { ReleasesNotesRoutingModule } from "./releases-notes-routing.module";

@NgModule({
	imports: [
		CoreModule,
		ReleasesNotesRoutingModule
	],
	declarations: [
		ReleasesNotesComponent
	],
	providers: [
		ReleasesNotesResolverService
	]
})
export class ReleasesNotesModule {
}
