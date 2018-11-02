import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { ReleaseNoteModel } from "@elevate/shared/models";

@Component({
	selector: "app-releases-notes",
	templateUrl: "./releases-notes.component.html",
	styleUrls: ["./releases-notes.component.scss"]
})
export class ReleasesNotesComponent implements OnInit, OnDestroy {

	public releasesNotes: ReleaseNoteModel[];
	public routeDataSubscription: Subscription;

	constructor(public route: ActivatedRoute) {
	}

	public ngOnInit(): void {

		this.routeDataSubscription = this.route.data.subscribe((data: { releasesNotes: ReleaseNoteModel[] }) => {
			this.releasesNotes = data.releasesNotes;
		});
	}

	public ngOnDestroy(): void {
		this.routeDataSubscription.unsubscribe();
	}
}
