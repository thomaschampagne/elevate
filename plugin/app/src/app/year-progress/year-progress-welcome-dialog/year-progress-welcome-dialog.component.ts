import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material";

@Component({
	selector: "app-fitness-trend-welcome-dialog",
	template: `
		<h2 mat-dialog-title>New feature: "Rolling progression" mode </h2>
		<mat-dialog-content class="mat-body-1">

			<div>
				The <strong>rolling progression</strong> mode helps you to analyze your training volume/intensity variations over a <i>"customise-able
				fixed rolling time window"</i> which slides every day.
			</div>

			<div>
				This is the total <i>"distance"</i>, <i>"time"</i>, <i>"elevation"</i> OR <i>"activity count"</i> you were able to maintain
				during this window. And this day after day. In long endurance sports, volume and intensity are the keys for success.
				Leaving apart intensity which can be obtained with Stress Scores (HRSS, PSS, ...), the rolling progression provides the
				simplest part of the equation which is hard to get right: <strong>the volume</strong>.
			</div>

			<div>
				By combining rolling progression with "targets", you will be able to track and ensure a defined training volume
				pace overtime (use the presets feature to define targets).
			</div>

			<div>
				To enable the <strong>rolling progression</strong>, just select "Rolling" in the mode field.
			</div>

			<div>
				To get help about the <strong>rolling and year to date progressions</strong>, click
				<mat-icon color="primary" inline>help_outline</mat-icon>
				icon.
			</div>

		</mat-dialog-content>
		<mat-dialog-actions>
			<div fxLayout="column" fxLayoutAlign="start start">
				<div fxFlex>
					<mat-checkbox [(ngModel)]="hideMessage">
						Don't show this message again
					</mat-checkbox>
				</div>
				<div fxFlex>
					<button mat-stroked-button mat-dialog-close color="primary" (click)="onGotIt()">Got it</button>
				</div>
			</div>
		</mat-dialog-actions>
	`,
	styles: [`
		div {
			padding-top: 10px;
			padding-bottom: 10px;
		}
	`]
})
export class YearProgressWelcomeDialogComponent implements OnInit {

	public static readonly LS_HIDE_YEAR_PROGRESS_WELCOME_DIALOG: string = "yearProgress_hideWelcomeInfoDialog"; // TODO To be removed in future

	public static readonly MAX_WIDTH: string = "40%";
	public static readonly MIN_WIDTH: string = "60%";

	public hideMessage: boolean;

	constructor(public dialogRef: MatDialogRef<YearProgressWelcomeDialogComponent>) {
	}

	public ngOnInit(): void {
	}

	public onGotIt(): void {
		if (this.hideMessage) {
			localStorage.setItem(YearProgressWelcomeDialogComponent.LS_HIDE_YEAR_PROGRESS_WELCOME_DIALOG, "true");
		}
		this.dialogRef.close();
	}
}
