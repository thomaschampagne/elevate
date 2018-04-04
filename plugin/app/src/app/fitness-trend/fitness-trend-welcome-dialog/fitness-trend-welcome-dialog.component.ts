import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material";

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

	constructor(public dialogRef: MatDialogRef<FitnessTrendWelcomeDialogComponent>,) {
	}

	public ngOnInit(): void {
	}

	public onGotIt(): void {
		if (this.hideMessage) {
			localStorage.setItem(FitnessTrendWelcomeDialogComponent.LS_HIDE_FITNESS_WELCOME_DIALOG, "true");
		}
		this.dialogRef.close();
	}
}
