import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { ViewableYearProgressDataModel } from "./models/viewable-year-progress-data.model";
import { ProgressionAtDayModel } from "./models/progression-at-date.model";
import { Subscription } from "rxjs/Subscription";
import { SideNavService } from "../shared/services/side-nav/side-nav.service";
import { WindowService } from "../shared/services/window/window.service";
import { YearProgressStyleModel } from "./models/year-progress-style.model";

// TODO Legend base: Year and value displayed
// TODO Persist + Load: "Activity types" checked
// TODO Persist + Load: "Years" checked
// TODO Persist + Load: "Commute rides" checked
// TODO Persist + Load: "Progress type" selected

// TODO Setup nice line colors palette

// TODO Run & Ride distance Target line display
// TODO Table result
// TODO setupComponentSizeChangeHandlers

// Service:
// DONE Return KM instead of meter distance
// DONE Handle metric / imperial here  (distance + elevation)!
// TODO Return current year progress until today or end of the year
// TODO Support Progress last year in graph (https://github.com/thomaschampagne/stravistix/issues/484)


@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit, OnDestroy {

	private static readonly LS_SELECTED_YEARS_KEY: string = "yearProgress_selectedYears";

	public static readonly PALETTE: string[] = ["red", "blue", "green", "purple", "orange"];

	public static readonly GRAPH_DOM_ELEMENT_ID: string = "yearProgressGraph";

	public yearProgressStyleModel: YearProgressStyleModel;

	public progressTypes: YearProgressTypeModel[];

	public availableActivityTypes: string[] = [];

	public selectedActivityTypes: string[] = [];

	public availableYears: number[] = [];

	public selectedYears: number[];

	public selectedProgressType: YearProgressTypeModel;

	public includeCommuteRide: boolean;

	public isMetric: boolean;

	public viewableYearProgressDataModel: ViewableYearProgressDataModel;

	public graphConfig: any;

	public yearProgressModels: YearProgressModel[]; // Progress for each year

	public syncedActivityModels: SyncedActivityModel[]; // Stored synced activities

	public progressionsAtDay: ProgressionAtDayModel[]; // Progressions for a specific day

	public dateWatched: Date; // Current day watched on year progress graph mouse over

	public sideNavChangesSubscription: Subscription;

	public windowResizingSubscription: Subscription;

	public static findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	constructor(public route: ActivatedRoute,
				public yearProgressService: YearProgressService,
				public sideNavService: SideNavService,
				public windowService: WindowService) {
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

		const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);

		// Compute unique sport types
		this.availableActivityTypes = _.map(activityCountByTypeModels, "type");

		// Select default checked sport type from the most performed one by the athlete
		this.selectedActivityTypes.push(YearProgressComponent.findMostPerformedActivityType(activityCountByTypeModels));

		// Set possible progress type to see: distance, time, ...
		this.progressTypes = [
			new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (this.isMetric) ? "kilometers" : "miles"),
			new YearProgressTypeModel(ProgressType.TIME, "Time", "hours"),
			new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (this.isMetric) ? "meters" : "feet"),
			new YearProgressTypeModel(ProgressType.COUNT, "Count")
		];

		// .. and set distance as the default on page load
		this.selectedProgressType = _.find(this.progressTypes, {type: ProgressType.DISTANCE});

		// List years
		this.availableYears = this.yearProgressService.availableYears(this.syncedActivityModels);//_.map(this.yearProgressModels, "year"); // TODO Use service

		// Seek for selected years saved by the user
		const existingSelectedYears = this.findExistingSelectedYears();
		this.selectedYears = (existingSelectedYears) ? existingSelectedYears : this.availableYears;

		// Compute first progression
		this.yearProgressModels = this.progression(this.syncedActivityModels, this.selectedActivityTypes,
			this.isMetric, this.includeCommuteRide);

		// Get color style for years
		this.yearProgressStyleModel = this.styleFromPalette(this.yearProgressModels, YearProgressComponent.PALETTE);

		// Push today marker
		this.viewableYearProgressDataModel = new ViewableYearProgressDataModel([{
			date: moment().startOf("day").toDate(),
			label: "Today"
		}]);

		this.setupGraphConfig();

		this.setupViewableGraphData();

		this.updateGraph();

		this.setupComponentSizeChangeHandlers();
	}

	/**
	 *
	 * @returns {number[]}
	 */
	public findExistingSelectedYears(): number[] {

		const existingSelectedYears = localStorage.getItem(YearProgressComponent.LS_SELECTED_YEARS_KEY);
		if (!_.isEmpty(existingSelectedYears)) {
			return JSON.parse(existingSelectedYears);
		}
		return null;
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @param {string[]} typesFilter
	 * @param {number[]} yearsFilter
	 * @param {boolean} isMetric
	 * @param {boolean} includeCommuteRide
	 * @returns {YearProgressModel[]}
	 */
	public progression(syncedActivityModels: SyncedActivityModel[], typesFilter: string[], isMetric: boolean,
					   includeCommuteRide: boolean): YearProgressModel[] {

		console.log("Compute progression with", typesFilter, includeCommuteRide);

		const progression = this.yearProgressService.progression(syncedActivityModels, typesFilter,
			null, // For all years
			isMetric, includeCommuteRide);

		console.log("progression: ", progression);

		return progression;
	}

	/**
	 *
	 */
	public setupViewableGraphData(): void {

		const yearLines: GraphPointModel[][] = [];

		_.forEach(this.yearProgressModels, (yearProgressModel: YearProgressModel) => {

			const isYearSelected = (_.indexOf(this.selectedYears, yearProgressModel.year) !== -1);

			if (isYearSelected) {

				const yearLine: GraphPointModel[] = [];

				_.forEach(yearProgressModel.progressions, (progressionModel: ProgressionModel) => {

					const graphPoint: Partial<GraphPointModel> = {
						date: moment().dayOfYear(progressionModel.onDayOfYear).format("YYYY-MM-DD"),
						hidden: false
					};

					switch (this.selectedProgressType.type) {
						case ProgressType.DISTANCE:
							graphPoint.value = progressionModel.totalDistance;
							break;

						case ProgressType.TIME:
							graphPoint.value = progressionModel.totalTime;
							break;

						case ProgressType.ELEVATION:
							graphPoint.value = progressionModel.totalElevation; // meters
							break;

						case ProgressType.COUNT:
							graphPoint.value = progressionModel.count;
							break;

						default:
							throw new Error("Unknown progress type: " + this.selectedProgressType.type);

					}

					yearLine.push(graphPoint as GraphPointModel);
				});

				yearLines.push(yearLine);
			}

		});

		this.viewableYearProgressDataModel.setGraphicsYearLines(yearLines);
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
		this.graphConfig.max_data_size = this.graphConfig.data.length;
		this.graphConfig.colors = this.colorsOfSelectedYears(this.selectedYears);
		this.graphConfig.markers = this.viewableYearProgressDataModel.markers;

	}

	public draw(): void {

		setTimeout(() => {
			// this.isGraphDataReady = true;
			MG.data_graphic(this.graphConfig);
			// console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
		});
	}

	/**
	 *
	 * @param {YearProgressModel[]} yearProgressModels
	 * @param {string[]} colorPalette
	 * @returns {YearProgressStyleModel}
	 */
	public styleFromPalette(yearProgressModels: YearProgressModel[], colorPalette: string[]): YearProgressStyleModel {

		const yearsColorsMap = new Map<number, string>();
		const colors: string[] = [];

		_.forEach(yearProgressModels, (yearProgressModel: YearProgressModel, index) => {
			const color = colorPalette[index % colorPalette.length];
			yearsColorsMap.set(yearProgressModel.year, color);
			colors.push(color);
		});

		return new YearProgressStyleModel(yearsColorsMap, colors);
	}

	/**
	 *
	 * @param {number[]} yearSelection
	 * @returns {string[]}
	 */
	public colorsOfSelectedYears(yearSelection: number[]): string[] {

		const colors = [];

		_.forEach(yearSelection, (year: number) => {
			colors.push(this.yearProgressStyleModel.yearsColorsMap.get(year));
		});

		return colors;
	}

	public setupComponentSizeChangeHandlers(): void {

		this.windowResizingSubscription = this.windowService.resizing.subscribe(() => this.onComponentSizeChanged());

		// Or user toggles the side nav (open/close states)
		this.sideNavChangesSubscription = this.sideNavService.changes.subscribe(() => this.onComponentSizeChanged());

	}

	/**
	 *
	 */
	public onSelectedActivityTypesChange(): void {

		if (this.selectedActivityTypes.length > 0) {
			this.reloadGraph();
		}

	}

	/**
	 *
	 */
	public onSelectedProgressTypeChange(): void {
		this.reloadGraph(true);
	}

	/**
	 *
	 */
	public onSelectedYearsChange(): void {

		YearProgressComponent.clearSvgGraphContent(); // Clear SVG content inside element
		this.reloadGraph();

		localStorage.setItem(YearProgressComponent.LS_SELECTED_YEARS_KEY, JSON.stringify(this.selectedYears));
	}

	/**
	 *
	 */
	public onIncludeCommuteRideToggle(): void {

		console.log(this.includeCommuteRide);
		this.reloadGraph();

	}

	/**
	 *
	 */
	public static clearSvgGraphContent(): void {
		document.getElementById(YearProgressComponent.GRAPH_DOM_ELEMENT_ID).children[0].remove();
	}

	/**
	 *
	 * @param {boolean} skipProgressionCalculation
	 */
	public reloadGraph(skipProgressionCalculation?: boolean): void {

		// Re-compute progression with new activity types selected
		if (!skipProgressionCalculation) {
			this.yearProgressModels = this.progression(this.syncedActivityModels, this.selectedActivityTypes, this.isMetric, this.includeCommuteRide);
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
					color: this.yearProgressStyleModel.yearsColorsMap.get(progressionModel.onYear)
				}
			;
			this.progressionsAtDay.push(progressAtDay);
		});
	}

	/**
	 *
	 */
	public onComponentSizeChanged(): void {
		this.draw();
	}

	public onGraphMouseOut(event: MetricsGraphicsEventModel): void {
		// this.setTodayAsViewedDay();
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
			missing_is_hidden_accessor: 'hidden',
			yax_count: 10,
			target: "#" + YearProgressComponent.GRAPH_DOM_ELEMENT_ID,
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1,
			showActivePoint: false,
			markers: [],
			legend: null,
			colors: [],
			max_data_size: 0,
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

	public ngOnDestroy(): void {
		this.windowResizingSubscription.unsubscribe();
		this.sideNavChangesSubscription.unsubscribe();
	}


}
