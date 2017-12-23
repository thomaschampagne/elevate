import { Component, OnInit } from '@angular/core';
import { YearProgressService } from "./services/year-progress.service";
import { ActivityCountByTypeModel } from "./models/activity-count-by-type.model";
import { YearProgressModel } from "./models/year-progress.model";
import * as _ from "lodash";
import { YearProgressTypeModel } from "./models/year-progress-type.model";
import { ProgressType } from "./models/progress-type.enum";
import { GraphPointModel } from "../shared/models/graphs/graph-point.model";
import { ProgressionModel } from "./models/progression.model";
import * as moment from "moment";
import { ActivatedRoute } from "@angular/router";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";
import { RequiredYearProgressDataModel } from "./models/required-year-progress-data.model";
import { MetricsGraphicsEventModel } from "../shared/models/graphs/metrics-graphics-event.model";
import * as d3 from "d3";


// TODO Line colors (try: https://www.npmjs.com/package/color-scheme)

// TODO Persist + Load: "Activity types" checked
// TODO Persist + Load: "Years" checked
// TODO Persist + Load: "Commute rides" checked
// TODO Persist + Load: "Progress type" selected
// TODO Progress last year in graph

// TODO Run & Ride distance Target line display
// TODO Imperial/metrics conversion

// TODO Table result


export class ViewableYearProgressDataModel { // TODO Export

	public yearLines: GraphPointModel[][] = [];

	constructor(yearLines: GraphPointModel[][]) {
		_.forEach(yearLines, (yearLine: GraphPointModel[]) => {
			this.yearLines.push(MG.convert.date(yearLine, "date"));
		});
	}
}

class ProgressionAtDateModel {// TODO Export
	date: Date;
	progressions: ProgressionModel[];
}



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
	public isMetric: boolean;

	public viewableYearProgressDataModel: ViewableYearProgressDataModel;

	public graphConfig: any;

	public yearProgressModels: YearProgressModel[]; // TODO remove ?!
	public syncedActivityModels: SyncedActivityModel[];
	public progressionAtDateModel: ProgressionAtDateModel;

	public static uniqueTypes(activitiesCountByTypes: ActivityCountByTypeModel[]): string[] {
		return _.map(activitiesCountByTypes, "type");
	}

	public static findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	constructor(public route: ActivatedRoute,
				public yearProgressService: YearProgressService) {
	}

	public ngOnInit() {

		this.route.data.subscribe((data: {

			requiredYearProgressDataModel: RequiredYearProgressDataModel

		}) => {

			this.isMetric = data.requiredYearProgressDataModel.isMetric;
			this.syncedActivityModels = data.requiredYearProgressDataModel.syncedActivityModels;

			// Set possible progress type to see: distance, time, ...
			this.progressTypes = [
				new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (this.isMetric) ? "km" : "mi"),
				new YearProgressTypeModel(ProgressType.TIME, "Time", "h"),
				new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (this.isMetric) ? "m" : "feet"),
				new YearProgressTypeModel(ProgressType.COUNT, "Count")
			];

			// .. and set distance as the default on page load
			this.selectedProgressType = _.find(this.progressTypes, {type: ProgressType.DISTANCE});

			const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);

			// Compute unique sport types
			this.availableActivityTypes = YearProgressComponent.uniqueTypes(activityCountByTypeModels);

			// Select default checked sport type from the most performed one by the athlete
			this.selectedActivityTypes.push(YearProgressComponent.findMostPerformedActivityType(activityCountByTypeModels));

			this.yearProgressModels = this.progression(this.syncedActivityModels, this.availableActivityTypes);

			this.setupGraphConfig();

			this.setupViewableGraphData();

			this.updateGraph();

			this.setupComponentSizeChangeHandlers();
		});
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @param {string[]} typesFilter
	 * @returns {YearProgressModel[]}
	 */
	public progression(syncedActivityModels: SyncedActivityModel[], typesFilter: string[]): YearProgressModel[] {
		return this.yearProgressService.progression(syncedActivityModels, typesFilter);
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		const yearLines: GraphPointModel[][] = [];

		_.forEach(this.yearProgressModels, (yearProgressModel: YearProgressModel) => {

			const yearLine: GraphPointModel[] = [];

			_.forEach(yearProgressModel.progressions, (progressionModel: ProgressionModel) => {

				const graphPoint: Partial<GraphPointModel> = {
					date: moment().dayOfYear(progressionModel.onDayOfYear).format("YYYY-MM-DD"),
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

				yearLine.push(graphPoint as GraphPointModel);
			});

			yearLines.push(yearLine);

		});

		this.viewableYearProgressDataModel = new ViewableYearProgressDataModel(yearLines);

	}

	public updateGraph(): void {
		try {
			// Apply changes
			this.updateViewableData();

			// Apply graph changes
			this.draw();

		} catch (error) {
			console.warn(error);
		}
	}


	/**
	 *
	 */
	public updateViewableData(): void {

		/*		const lines: GraphPointModel[][] = [];
                const indexes = this.fitnessService.indexesOf(this.periodViewed, this.fitnessTrend);

                _.forEach(this.viewableYearProgressDataModel.fitnessTrendLines, (line: GraphPointModel[]) => {
                    lines.push(line.slice(indexes.start, indexes.end));
                });*/
		console.log(this.viewableYearProgressDataModel.yearLines);

		this.graphConfig.data = this.viewableYearProgressDataModel.yearLines;
		// this.graphConfig.markers = this.viewableYearProgressDataModel.markers;
		// this.graphConfig.baselines = this.viewableYearProgressDataModel.getBaseLines(this.isTrainingZonesEnabled);
	}

	public draw(): void {

		setTimeout(() => {

			// this.isGraphDataReady = true;
			MG.data_graphic(this.graphConfig);
			// console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
		});
	}

	private setupComponentSizeChangeHandlers(): void {
		// TODO
	}

	private onGraphMouseOver(event: MetricsGraphicsEventModel): void {

		this.progressionAtDateModel = {
			date: event.key,
			progressions: []
		};

		_.forEach(event.values, (value, index) => {
			const progressionModel: ProgressionModel = _.find(this.yearProgressModels[index].progressions, {
				onDayOfYear: moment(value.date).dayOfYear()
			});
			this.progressionAtDateModel.progressions.push(progressionModel);
		});
	}


	private onGraphMouseOut(event: MetricsGraphicsEventModel): void {
		// this.setTodayAsViewedDay();
	}

	public setupGraphConfig(): void {

		this.graphConfig = {
			data: [],
			full_width: true,
			height: window.innerHeight * 0.55,
			right: 40,
			baselines: [{value: 1000, label: null}], // TODO remove
			animate_on_load: false,
			transition_on_update: false,
			aggregate_rollover: true,
			interpolate: d3.curveLinear,
			missing_is_hidden: true,
			// max_data_size: 6, // TODO !! how many?!
			missing_is_hidden_accessor: 'hidden',
			yax_count: 10,
			target: "#yearProgressGraph",
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1.2,
			showActivePoint: true,
			markers: [{date: new Date(), label: "pouet"}], // TODO remove or keep for today?
			legend: null,
			custom_style: {
				lines: [
					{
						"stroke": "black", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "black", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "black" // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "black", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "black", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "red", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					},
					{
						"stroke": "green", // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
					}

				],
				circleColors: ["black", "black", "black", "black", "black", "red", "green"] // TODO Extract color. Unify with SASS file ($atl-color: #515151;)
			},
			// click: (metricsGraphicsEvent: MetricsGraphicsEventModel) => {
			// 	this.onGraphClick(metricsGraphicsEvent);
			// },
			mouseover: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOver(data);
			},
			mouseout: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOut(data);
			}
		};
	}


}
