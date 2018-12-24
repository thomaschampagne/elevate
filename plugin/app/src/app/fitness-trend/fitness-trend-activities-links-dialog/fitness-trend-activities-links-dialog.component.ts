import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { FitnessTrendComponent } from "../fitness-trend.component";

@Component({
	selector: "app-fitness-trend-activities-links-dialog",
	templateUrl: "./fitness-trend-activities-links-dialog.component.html",
	styleUrls: ["./fitness-trend-activities-links-dialog.component.scss"]
})
export class FitnessTrendActivitiesLinksDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	constructor(@Inject(MAT_DIALOG_DATA) public dayFitnessTrendModel: DayFitnessTrendModel) {
	}

	public ngOnInit(): void {
	}

	public openActivity(activityId: number): void {
		FitnessTrendComponent.openActivity(activityId);
	}

	public openAllActivities(): void {
		FitnessTrendComponent.openActivities(this.dayFitnessTrendModel.ids);
	}
}
