import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-fitness-trend-welcome-dialog",
	templateUrl: "./fitness-trend-welcome-dialog.component.html",
	styleUrls: ["./fitness-trend-welcome-dialog.component.scss"]
})
export class FitnessTrendWelcomeDialogComponent implements OnInit {

	public static readonly LS_HIDE_FITNESS_WELCOME_DIALOG: string = "fitnessTrend_hideWelcomeDialog"; // TODO To be removed in future

	public static readonly MAX_WIDTH: string = "40%";
	public static readonly MIN_WIDTH: string = "60%";

	public hideMessage: boolean;

	constructor() {
	}

	public ngOnInit(): void {
	}

	public onShowMessageChange(): void {
		if (this.hideMessage) {
			localStorage.setItem(FitnessTrendWelcomeDialogComponent.LS_HIDE_FITNESS_WELCOME_DIALOG, "true");
		} else {
			localStorage.removeItem(FitnessTrendWelcomeDialogComponent.LS_HIDE_FITNESS_WELCOME_DIALOG);
		}
	}
}
