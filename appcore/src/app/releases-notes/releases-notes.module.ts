import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { ReleasesNotesComponent } from "./releases-notes.component";
import { ReleasesNotesRoutingModule } from "./releases-notes-routing.module";
import { ReleaseNoteService } from "./release-note.service";

@NgModule({
  imports: [CoreModule, ReleasesNotesRoutingModule],
  declarations: [ReleasesNotesComponent],
  providers: [ReleaseNoteService]
})
export class ReleasesNotesModule {}
