import { Component, OnInit } from '@angular/core';
import { YearProgressService } from "./year-progress.service";
import { ActivitiesCountByTypeModel } from "./models/activities-count-by-type.model";
import { YearProgressModel } from "./models/year-progress.model";
import * as _ from "lodash";

@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

	constructor(public yearProgressService: YearProgressService) {

	}

	public ngOnInit() {

		this.yearProgressService.countActivitiesByType().then((activitiesCountByTypes: ActivitiesCountByTypeModel[]) => {

			console.log("activitiesCountByTypes", activitiesCountByTypes);

			const typesFilter = _.map(activitiesCountByTypes, "type");

			console.log("typesFilter", typesFilter);

			return this.yearProgressService.progression(typesFilter);

		}).then((yearProgressModels: YearProgressModel[]) => {

			console.log("yearProgressModels", yearProgressModels);

		}, error => {

			alert(error);

		});

	}

}
