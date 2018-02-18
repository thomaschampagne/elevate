import { Injectable } from "@angular/core";
import { IReleaseNote, releaseNotes } from "../../../../common/scripts/ReleaseNotes";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";

@Injectable()
export class ReleasesNotesResolverService implements Resolve<IReleaseNote[]> {

	constructor() {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): IReleaseNote[] {
		return releaseNotes;
	}

}
