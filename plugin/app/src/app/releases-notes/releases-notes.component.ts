import { Component, OnDestroy, OnInit } from "@angular/core";
import { IReleaseNote } from "../../../../common/scripts/ReleaseNotes";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-releases-notes",
	templateUrl: "./releases-notes.component.html",
	styleUrls: ["./releases-notes.component.scss"]
})
export class ReleasesNotesComponent implements OnInit, OnDestroy {

	public releasesNotes: IReleaseNote[];
	public routeDataSubscription: Subscription;

	constructor(private route: ActivatedRoute) {
	}

	public ngOnInit(): void {

		this.routeDataSubscription = this.route.data.subscribe((data: { releasesNotes: IReleaseNote[] }) => {
			this.releasesNotes = data.releasesNotes;
		});
	}

	public ngOnDestroy(): void {
		this.routeDataSubscription.unsubscribe();
	}
}
