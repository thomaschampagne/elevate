import { Injectable } from "@angular/core";
import { ReleaseNoteModel, releaseNotesData } from "@elevate/shared";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";

@Injectable()
export class ReleasesNotesResolverService implements Resolve<ReleaseNoteModel[]> {

	constructor() {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): ReleaseNoteModel[] {
		return releaseNotesData;
	}

}
