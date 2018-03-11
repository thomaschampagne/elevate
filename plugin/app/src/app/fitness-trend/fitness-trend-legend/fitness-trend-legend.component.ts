import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { ViewedDayService } from "../shared/services/viewed-day.service";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-fitness-trend-legend",
	templateUrl: "./fitness-trend-legend.component.html",
	styleUrls: ["./fitness-trend-legend.component.scss"]
})
export class FitnessTrendLegendComponent implements OnInit, OnDestroy {

	public readonly MAX_ACTIVITIES_LEGEND_SHOWN: number = 2;

	@Input("isTrainingZonesEnabled")
	public isTrainingZonesEnabled;

	public viewedDay: DayFitnessTrendModel;
	public subscription: Subscription;

	constructor(public viewedDayService: ViewedDayService) {
	}

	public ngOnInit(): void {
		this.subscription = this.viewedDayService.changes.subscribe((viewedDay: DayFitnessTrendModel) => {
			this.viewedDay = viewedDay;
		});
	}

	public ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}
}
