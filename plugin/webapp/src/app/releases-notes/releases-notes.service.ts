import { Injectable } from '@angular/core';
import { IReleaseNote, releaseNotes } from "../../../../common/scripts/ReleaseNotes";

@Injectable()
export class ReleasesNotesService {

	constructor() {
	}

	public get(): IReleaseNote[] { // TODO change to ReleaseNoteModel class
		return releaseNotes;
	}

}
