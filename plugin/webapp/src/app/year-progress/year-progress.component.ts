import { Component, OnInit } from '@angular/core';
import { YearProgressService } from "./year-progress.service";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { YearProgressModel } from "./models/year-progress.model";
import * as _ from "lodash";
import { YearProgressTypeModel } from "./models/year-progress-type.model";
import { ProgressType } from "./models/progress-type.enum";

@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

	public readonly ProgressType = ProgressType; // Inject enum as class member

	public readonly progressTypes: YearProgressTypeModel[] = [
		new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", "km"), // TODO Think Imperial too !
		new YearProgressTypeModel(ProgressType.TIME, "Time", "h"),
		new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", "m"), // TODO Think Imperial too !
		new YearProgressTypeModel(ProgressType.COUNT, "Count")
	];

	public availableActivityTypes: string[] = [];
	public selectedActivityTypes: string[] = [];
	public selectedProgressType: YearProgressTypeModel;

	// public mostPerformedActivityType: string;

	constructor(public yearProgressService: YearProgressService) {
	}

	public ngOnInit() {


		this.yearProgressService.countActivitiesByType().then((activityCountByTypes: ActivityCountByTypeModel[]) => {

			// Default selectedProgressType
			this.selectedProgressType = _.find(this.progressTypes, {type: ProgressType.DISTANCE});

			// console.log("activityCountByTypes", activityCountByTypes);
			this.availableActivityTypes = this.uniqueTypes(activityCountByTypes);
			this.selectedActivityTypes.push(this.findMostPerformedActivityType(activityCountByTypes));

			return this.yearProgressService.progression(this.availableActivityTypes);

		}).then((yearProgressModels: YearProgressModel[]) => {

			console.log("yearProgressModels", yearProgressModels);

		}, error => {

			alert(error);

		});

	}

	public uniqueTypes(activitiesCountByTypes: ActivityCountByTypeModel[]) {
		return _.map(activitiesCountByTypes, "type");
	}

	public findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}
}
