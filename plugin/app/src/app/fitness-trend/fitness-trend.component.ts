import { Component, OnInit } from "@angular/core";
import * as _ from "lodash";

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend.component.html",
	styleUrls: ["./fitness-trend.component.scss"]
})
export class FitnessTrendComponent implements OnInit {

	public readonly GRAPH_COMPONENT_INDEX: number = 0;

	public hasFitnessTrendData: boolean = null; // Can be null because true/false state will assigned through asynchronous data fetching
	public selectedTabIndex: number;

	public static openActivities(ids: number[]) {

		if (ids.length > 0) {
			const url = "https://www.strava.com/activities/{activityId}";
			_.forEach(ids, (id: number) => {
				window.open(url.replace("{activityId}", id.toString()), "_blank");
			});
		} else {
			console.warn("No activities found");
		}
	}

	constructor() {
	}


	public ngOnInit(): void {
	}

	public onHasFitnessTrendDataNotify(hasFitnessTrendData: boolean): void {
		this.hasFitnessTrendData = hasFitnessTrendData;
	}

	public onSelectedIndexChange(selectedTabIndex: number): void {
		this.selectedTabIndex = selectedTabIndex;
	}

}

