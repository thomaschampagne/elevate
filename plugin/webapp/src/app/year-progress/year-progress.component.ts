import { Component, OnInit } from '@angular/core';
import { YearProgressService } from "./year-progress.service";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { YearProgressModel } from "./models/year-progress.model";
import * as _ from "lodash";
import { YearProgressTypeModel } from "./models/year-progress-type.model";
import { ProgressType } from "./models/progress-type.enum";
import * as d3 from "d3";
import { GraphPointModel } from "../shared/models/graph-point.model";
import { ProgressionModel } from "./models/progression.model";
import * as moment from "moment";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";

@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

	public readonly ProgressType = ProgressType; // Inject enum as class member

	public progressTypes: YearProgressTypeModel[];

	public availableActivityTypes: string[] = [];
	public selectedActivityTypes: string[] = [];
	public selectedProgressType: YearProgressTypeModel;

	public graphConfig: any;
	public isMetric: boolean;

	public yearProgressModels: YearProgressModel[];

	constructor(public userSettingsService: UserSettingsService,
				public yearProgressService: YearProgressService) {
	}

	public ngOnInit() {


		Promise.all([

			this.userSettingsService.fetch(),
			this.yearProgressService.activitiesByTypes(),

		]).then((results: Object[]) => {

			const userSettingsModel = _.first(results) as UserSettingsModel;
			const activityCountByTypeModels = _.last(results) as ActivityCountByTypeModel[];

			// Set the unit system of the user.
			this.isMetric = (userSettingsModel.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);

			// Set possible progress type to see: distance, time, ...
			this.progressTypes = [
				new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (this.isMetric) ? "km" : "mi"),
				new YearProgressTypeModel(ProgressType.TIME, "Time", "h"),
				new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (this.isMetric) ? "m" : "feet"),
				new YearProgressTypeModel(ProgressType.COUNT, "Count")
			];

			// .. and set distance as the default on page load
			this.selectedProgressType = _.find(this.progressTypes, {type: ProgressType.DISTANCE});

			// Compute unique types
			this.availableActivityTypes = this.uniqueTypes(activityCountByTypeModels);

			// Select default checked sport type from the most performed one by the athlete
			this.selectedActivityTypes.push(this.findMostPerformedActivityType(activityCountByTypeModels));

			return this.yearProgressService.progression(this.availableActivityTypes);

		}).then((yearProgressModels: YearProgressModel[]) => {

			this.setup(yearProgressModels);

		}, error => {

			console.error(error);

		});

	}

	/**
	 *
	 */
	public setup(yearProgressModels: YearProgressModel[]): void { // TODO Rename setup seems to be in ngOnInit

		this.yearProgressModels = yearProgressModels;

		this.setupGraphConfig();
		// this.setupTimeData();
		this.setupViewableGraphData();
		// this.updateGraph(); // TODO
		// this.setupComponentSizeChangeHandlers(); // TODO
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		const yearLines: GraphPointModel[][] = [];

		_.forEach(this.yearProgressModels, (yearProgressModel: YearProgressModel, index: number, yearProgressModels: YearProgressModel[]) => {

			const line: GraphPointModel[] = [];

			_.forEach(yearProgressModel.progressions, (progressionModel: ProgressionModel) => {

				const graphPoint: Partial<GraphPointModel> = {
					date: moment().dayOfYear(progressionModel.onDayOfYear).format("0000-MM-DD"),
					hidden: false
				};

				switch (this.selectedProgressType.type) {
					case ProgressType.DISTANCE:
						graphPoint.value = progressionModel.totalDistance / 1000; // km
						break;

					case ProgressType.TIME:
						graphPoint.value = progressionModel.totalTime / 3600; // hours
						break;

					case ProgressType.ELEVATION:
						graphPoint.value = progressionModel.totalElevation; // meters
						break;

					case ProgressType.COUNT:
						graphPoint.value = progressionModel.count; // meters
						break;

					default:
						throw new Error("Unknown progress type: " + this.selectedProgressType.type);

				}

				line.push(graphPoint as GraphPointModel);
			});

			yearLines.push(line);
		});

		console.log(yearLines);
	}

	public uniqueTypes(activitiesCountByTypes: ActivityCountByTypeModel[]) {
		return _.map(activitiesCountByTypes, "type");
	}

	public findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	public setupGraphConfig(): void {

		this.graphConfig = {
			data: [],
			full_width: true,
			height: window.innerHeight * 0.55,
			right: 40,
			baselines: [],
			animate_on_load: false,
			transition_on_update: false,
			aggregate_rollover: true,
			interpolate: d3.curveLinear,
			missing_is_hidden: true,
			max_data_size: 6,
			missing_is_hidden_accessor: 'hidden',
			yax_count: 10,
			target: "#yearProgressGraph",
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1.2,
			showActivePoint: false,
			markers: null,
			legend: null,
			/*click: (metricsGraphicsEvent: MetricsGraphicsEventModel) => {
				this.onGraphClick(metricsGraphicsEvent);
			},
			mouseover: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOver(data.key);
			},
			mouseout: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOut(data.key);
			}*/
		};
	}
}
