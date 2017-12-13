import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from "@angular/material";
import * as _ from "lodash";

@Component({
	selector: 'app-fitness-trend',
	templateUrl: './fitness-trend.component.html',
	styleUrls: ['./fitness-trend.component.scss']
})
export class FitnessTrendComponent implements OnInit {

	public static readonly GRAPH_TAB_INDEX: number = 0;
	public static readonly TABLE_TAB_INDEX: number = 1;

	public fitnessTableActive: boolean = false;

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


	public onFocusChange(event: MatTabChangeEvent): void {
		console.log("onFocusChange", event);
	}

	public onSelectedIndexChange(index: number): void {
		console.log("onSelectedIndexChange", index);

		if (index === FitnessTrendComponent.TABLE_TAB_INDEX) {
			this.fitnessTableActive = true;
		}
	}

	public onSelectedTabChange(event: MatTabChangeEvent): void {
		console.log("onSelectedTabChange", event);
	}

	public onSelectChange(): void {
		console.log("onSelectChange");
	}

}
