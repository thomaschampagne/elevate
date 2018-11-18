import { Injectable } from "@angular/core";
import { ReleaseNoteModel } from "@elevate/shared/models";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { releaseNotesData } from "@elevate/shared/data";

@Injectable()
export class ReleasesNotesResolverService implements Resolve<ReleaseNoteModel[]> {

	constructor() {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): ReleaseNoteModel[] {
		return releaseNotesData;
	}

}
