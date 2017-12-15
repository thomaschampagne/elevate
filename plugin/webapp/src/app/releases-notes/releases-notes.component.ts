import { Component, OnInit } from '@angular/core';
import { IReleaseNote } from "../../../../common/scripts/ReleaseNotes";
import { ActivatedRoute } from "@angular/router";

@Component({
	selector: 'app-releases-notes',
	templateUrl: './releases-notes.component.html',
	styleUrls: ['./releases-notes.component.scss']
})
export class ReleasesNotesComponent implements OnInit {

	public releasesNotes: IReleaseNote[];

	constructor(private route: ActivatedRoute) {
	}

	public ngOnInit() {
		this.route.data.subscribe((data: { releasesNotes: IReleaseNote[] }) => {
			this.releasesNotes = data.releasesNotes;
		});
	}
}
