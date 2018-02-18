import { Component, OnDestroy, OnInit } from "@angular/core";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-remote-athlete-mismatch",
	templateUrl: "./remote-athlete-mismatch.component.html",
	styleUrls: ["./remote-athlete-mismatch.component.scss"]
})
export class RemoteAthleteMismatchComponent implements OnInit, OnDestroy {

	public localRemoteAthleteProfileSame: Subscription;

	constructor(public athleteHistoryService: AthleteHistoryService) {
	}

	public ngOnInit(): void {
		this.localRemoteAthleteProfileSame = this.athleteHistoryService.localRemoteAthleteProfileSame.subscribe();
	}

	public ngOnDestroy(): void {
		this.localRemoteAthleteProfileSame.unsubscribe();
	}

}
