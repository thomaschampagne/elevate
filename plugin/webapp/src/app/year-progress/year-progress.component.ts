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
import { MarkerModel } from "../fitness-trend/fitness-trend-graph/models/marker.model";
import { ViewableYearProgressDataModel } from "./models/viewable-year-progress-data.model";
import { ProgressionAtDayModel } from "./models/progression-at-date.model";
import { YearLineStyleModel } from "./models/year-line-style.model";
import { YearProgressStyleModel } from "./models/year-progress-style.model";

// DONE Line colors (try: https://www.npmjs.com/package/color-scheme)

// TODO Legend base: Year and value displayed
// TODO Persist + Load: "Activity types" checked
// TODO Persist + Load: "Years" checked
// TODO Persist + Load: "Commute rides" checked
// TODO Persist + Load: "Progress type" selected

// TODO Setup nice line colors palette

// TODO Progress last year in graph

// TODO Run & Ride distance Target line display
// TODO Imperial/metrics conversion
// TODO Table result
// TODO setupComponentSizeChangeHandlers


@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

	public static readonly PALETTE: string[] = ["red", "blue", "green", "purple", "orange"];

	// public readonly ProgressType = ProgressType; // Inject enum as class member

	public progressTypes: YearProgressTypeModel[];

	public availableActivityTypes: string[] = [];

	public selectedActivityTypes: string[] = [];

	public availableYears: number[] = [];

	public selectedYears: number[] = [];

	public selectedProgressType: YearProgressTypeModel;

	public includeCommuteRide: boolean;

	public isMetric: boolean;

	public viewableYearProgressDataModel: ViewableYearProgressDataModel;

	public graphConfig: any;

	public yearProgressModels: YearProgressModel[]; // Progress for each year

	public syncedActivityModels: SyncedActivityModel[]; // Stored synced activities

	public progressionsAtDay: ProgressionAtDayModel[]; // Progressions for a specific day

	public dateWatched: Date;

	public static findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	constructor(public route: ActivatedRoute,
				public yearProgressService: YearProgressService) {
	}

	/**
	 *
	 */
	public ngOnInit(): void {

		this.route.data.subscribe((data: { requiredYearProgressDataModel: RequiredYearProgressDataModel }) => {

			this.setup(
				data.requiredYearProgressDataModel.isMetric,
				data.requiredYearProgressDataModel.syncedActivityModels
			);
		});
	}

	/**
	 *
	 * @param {boolean} isMetric
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 */
	public setup(isMetric: boolean, syncedActivityModels: SyncedActivityModel[]): void {

		this.isMetric = isMetric;

		this.syncedActivityModels = syncedActivityModels;

		// Keep commute rides in stats by default
		this.includeCommuteRide = true;

		// Set possible progress type to see: distance, time, ...
		this.progressTypes = [
			new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (this.isMetric) ? "kilometers" : "miles"),
			new YearProgressTypeModel(ProgressType.TIME, "Time", "hours"),
			new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (this.isMetric) ? "meters" : "feet"),
			new YearProgressTypeModel(ProgressType.COUNT, "Count")
		];

		// .. and set distance as the default on page load
		this.selectedProgressType = _.find(this.progressTypes, {type: ProgressType.DISTANCE});

		const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);

		// Compute unique sport types
		this.availableActivityTypes = _.map(activityCountByTypeModels, "type");

		// Select default checked sport type from the most performed one by the athlete
		this.selectedActivityTypes.push(YearProgressComponent.findMostPerformedActivityType(activityCountByTypeModels));

		// Compute first progression
		this.yearProgressModels = this.progression(this.syncedActivityModels, this.selectedActivityTypes, this.includeCommuteRide);

		// List years
		this.availableYears = _.map(this.yearProgressModels, "year").reverse();

		// Default selected years
		this.selectedYears = this.availableYears;

		this.setupGraphConfig();

		this.setupViewableGraphData();

		this.updateGraph();

		this.setupComponentSizeChangeHandlers();
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @param {string[]} typesFilter
	 * @returns {YearProgressModel[]}
	 */
	public progression(syncedActivityModels: SyncedActivityModel[], typesFilter: string[], includeCommuteRide: boolean): YearProgressModel[] {
		console.log("Compute progression with", typesFilter, includeCommuteRide);
		return this.yearProgressService.progression(syncedActivityModels, typesFilter, includeCommuteRide);
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		const todayMarker: MarkerModel = {
			date: moment().startOf("day").toDate(),
			label: "Today"
		};

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

		const style: YearProgressStyleModel = this.getYearProgressStyleFromPalette(this.yearProgressModels,
			YearProgressComponent.PALETTE);

		this.viewableYearProgressDataModel = new ViewableYearProgressDataModel(yearLines, [todayMarker], style);

	}

	/**
	 *
	 */
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
		this.graphConfig.data = this.viewableYearProgressDataModel.yearLines;
		this.graphConfig.markers = this.viewableYearProgressDataModel.markers;
		this.graphConfig.custom_style.lines = this.viewableYearProgressDataModel.style.lineStyles;
		this.graphConfig.custom_style.circle_colors = this.viewableYearProgressDataModel.style.circleColors;
	}

	public draw(): void {

		setTimeout(() => {
			// this.isGraphDataReady = true;
			MG.data_graphic(this.graphConfig);
			// console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
		});
	}


	public setupComponentSizeChangeHandlers(): void {
		// TODO
	}

	/**
	 *
	 */
	public onSelectedActivityTypesChange(): void {

		if (this.selectedActivityTypes.length > 0) {
			this.reloadGraph(true);
		}

	}

	/**
	 *
	 */
	public onSelectedProgressTypeChange(): void {
		this.reloadGraph(false);
	}

	/**
	 *
	 */
	public onSelectedYearsChange(): void {

		// TODO Years not selected  should not be displayed or even not computed at all in the service?
		/*

		console.log(this.selectedYears);
		this.yearProgressModels = _.filter(this.yearProgressModels, (yearProgressModel: YearProgressModel) => {
			return (_.indexOf(this.selectedYears, yearProgressModel.year) !== -1);
		});
		console.log(this.yearProgressModels);

		*/

		this.reloadGraph(false);


	}

	/**
	 *
	 */
	public onIncludeCommuteRideToggle(): void {

		console.log(this.includeCommuteRide);
		this.reloadGraph(true);

	}

	/**
	 *
	 * @param {boolean} reComputeProgression
	 */
	public reloadGraph(reComputeProgression: boolean): void {
		// Re-compute progression with new activity types selected
		if (reComputeProgression) {
			this.yearProgressModels = this.progression(this.syncedActivityModels, this.selectedActivityTypes, this.includeCommuteRide);
		}
		this.setupViewableGraphData();
		this.updateGraph();
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} mgEvent
	 */
	public onGraphMouseOver(mgEvent: MetricsGraphicsEventModel): void {

		this.dateWatched = mgEvent.key;

		this.progressionsAtDay = [];

		_.forEach(mgEvent.values, (value, index) => {

			const momentAtDay = moment(value.date);

			const progressionModel: ProgressionModel = _.find(this.yearProgressModels[index].progressions, {
				onDayOfYear: momentAtDay.dayOfYear()
			});

			const progressAtDay: ProgressionAtDayModel = {
				date: momentAtDay.year(progressionModel.onYear).toDate(),
				year: progressionModel.onYear,
				progressType: this.selectedProgressType.type,
				value: progressionModel.valueOf(this.selectedProgressType.type),
				color: this.viewableYearProgressDataModel.getYearColor(progressionModel.onYear)
			};
			this.progressionsAtDay.push(progressAtDay);
		});
	}


	// public onGraphMouseOut(event: MetricsGraphicsEventModel): void {
	// 	// this.setTodayAsViewedDay();
	// }

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
			max_data_size: this.yearProgressModels.length,
			missing_is_hidden_accessor: 'hidden',
			yax_count: 10,
			target: "#yearProgressGraph",
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1,
			showActivePoint: false,
			markers: [],
			legend: null,
			custom_style: {
				lines: [],
				circle_colors: []
			},
			// click: (metricsGraphicsEvent: MetricsGraphicsEventModel) => {
			// 	this.onGraphClick(metricsGraphicsEvent);
			// },
			mouseover: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOver(data);
			},
			// mouseout: (data: MetricsGraphicsEventModel) => {
			// 	this.onGraphMouseOut(data);
			// }
		};
	}

	/**
	 *
	 * @param {YearProgressModel[]} yearProgressModels
	 * @param {string[]} colorPalette
	 * @returns {YearLineStyleModel[]}
	 */
	public getYearProgressStyleFromPalette(yearProgressModels: YearProgressModel[], colorPalette: string[]): YearProgressStyleModel {

		const lineStyles: YearLineStyleModel[] = [];
		const colorMap: Map<number, string> = new Map<number, string>();
		const circleColors: string[] = [];

		_.forEach(yearProgressModels, (yearProgressModel: YearProgressModel, index) => {

			const reverseIndex = (yearProgressModels.length - 1) - index;
			const color = colorPalette[reverseIndex % colorPalette.length];

			colorMap.set(yearProgressModel.year, color);

			lineStyles.push({
				stroke: color
			});

			circleColors.push(color);
		});

		return new YearProgressStyleModel(lineStyles, colorMap, circleColors);
	}
}
