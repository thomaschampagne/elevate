import { Injectable } from "@angular/core";
import { releaseNotes } from "../../../../shared/ReleaseNotes";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { ReleaseNoteModel } from "../../../../shared/models/release-note.model";

@Injectable()
export class ReleasesNotesResolverService implements Resolve<ReleaseNoteModel[]> {

	constructor() {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): ReleaseNoteModel[] {
		return releaseNotes;
	}

}
