import { Component, OnInit } from '@angular/core';
import { ReleasesNotesService } from "./releases-notes.service";
import { IReleaseNote } from "../../../../common/scripts/ReleaseNotes";

@Component({
	selector: 'app-releases-notes',
	templateUrl: './releases-notes.component.html',
	styleUrls: ['./releases-notes.component.scss'],
	providers: [ReleasesNotesService]
})
export class ReleasesNotesComponent implements OnInit {

	public releasesNotes: IReleaseNote[];

	constructor(public releasesNotesService: ReleasesNotesService) {
	}

	public ngOnInit() {
		// TODO Fetch releasesNotes with a Content Resolver !!
		this.releasesNotes = this.releasesNotesService.get();
	}

}
