import { Injectable } from "@angular/core";
import { releaseNotesData } from "../../../../core/scripts/shared/release-notes.data";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { ReleaseNoteModel } from "../../../../core/scripts/shared/models/release-note.model";

@Injectable()
export class ReleasesNotesResolverService implements Resolve<ReleaseNoteModel[]> {

	constructor() {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): ReleaseNoteModel[] {
		return releaseNotesData;
	}

}
