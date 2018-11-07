import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ReleasesNotesComponent } from "./releases-notes.component";
import { ReleasesNotesResolverService } from "./releases-notes-resolver.service";

const routes: Routes = [
	{
		path: "",
		component: ReleasesNotesComponent,
		resolve: {
			releasesNotes: ReleasesNotesResolverService
		}
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
export class ReleasesNotesRoutingModule {
}
