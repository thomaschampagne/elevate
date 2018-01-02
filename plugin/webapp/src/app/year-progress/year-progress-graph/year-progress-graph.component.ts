import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { YearProgressStyleModel } from "./models/year-progress-style.model";
import { ViewableYearProgressDataModel } from "./models/viewable-year-progress-data.model";
import { ProgressionAtDayModel } from "../shared/models/progression-at-date.model";
import * as moment from "moment";
import { Moment } from "moment";
import * as _ from "lodash";
import { YearProgressModel } from "../shared/models/year-progress.model";
import { ProgressionModel } from "../shared/models/progression.model";
import * as d3 from "d3";
import { MetricsGraphicsEventModel } from "../../shared/models/graphs/metrics-graphics-event.model";
import { ProgressType } from "../shared/models/progress-type.enum";
import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { Subscription } from "rxjs/Subscription";
import { WindowService } from "../../shared/services/window/window.service";
import { SideNavService } from "../../shared/services/side-nav/side-nav.service";

@Component({
	selector: 'app-year-progress-graph',
	templateUrl: './year-progress-graph.component.html',
	styleUrls: ['./year-progress-graph.component.scss']
})
export class YearProgressGraphComponent implements OnInit, OnChanges, OnDestroy {

	public static readonly PALETTE: string[] = ["red", "blue", "green", "purple", "orange"];
	public static readonly GRAPH_DOM_ELEMENT_ID: string = "yearProgressGraph";

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressModels")
	public yearProgressModels: YearProgressModel[];

	@Input("todayMoment")
	public todayMoment: Moment;

	public initialized: boolean = false;
	public yearProgressStyleModel: YearProgressStyleModel;
	public viewableYearProgressDataModel: ViewableYearProgressDataModel;
	public progressionsAtDay: ProgressionAtDayModel[]; // Progressions for a specific day
	public momentWatched: Moment; // Current day watched on year progress graph mouse over
	public graphConfig: any;

	public sideNavChangesSubscription: Subscription;
	public windowResizingSubscription: Subscription;

	constructor(public sideNavService: SideNavService,
				public windowService: WindowService) {
	}

	public ngOnInit(): void {

		// Get color style for years
		this.yearProgressStyleModel = this.styleFromPalette(this.yearProgressModels, YearProgressGraphComponent.PALETTE);

		this.viewableYearProgressDataModel = new ViewableYearProgressDataModel([{
			date: this.todayMoment.toDate(),
			label: this.todayMoment.format("MMM Do")
		}]);

		// By default progression shown in legend is today
		this.progressionsAtDay = this.findProgressionsAtDay(this.yearProgressModels, this.todayMoment);

		// By default moment watched is today
		this.momentWatched = this.todayMoment;

		// Now setup graph aspects
		this.setupGraphConfig();

		this.setupViewableGraphData();

		this.updateGraph();

		this.setupComponentSizeChangeHandlers();

		this.initialized = true;
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		// Clear svg content if year selection changed
		if (changes.selectedYears) {
			YearProgressGraphComponent.clearSvgGraphContent();
		}

		// Always re-draw svg content
		this.reloadGraph();

		// Then update graph legend
		this.progressionsAtDay = this.findProgressionsAtDay(this.yearProgressModels, this.momentWatched);
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
						date: moment().dayOfYear(progressionModel.dayOfYear).format("YYYY-MM-DD"),
						hidden: progressionModel.isFuture
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

	/**
	 *
	 */
	public draw(): void {
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
		});
	}

	/**
	 *
	 */
	public static clearSvgGraphContent(): void {
		document.getElementById(YearProgressGraphComponent.GRAPH_DOM_ELEMENT_ID).children[0].remove();
	}

	/**
	 *
	 */
	public reloadGraph(): void {
		this.setupViewableGraphData();
		this.updateGraph();
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
	 * @param {YearProgressModel[]} yearProgressModels
	 * @param {moment.Moment} dayMoment
	 * @returns {ProgressionAtDayModel[]}
	 */
	public findProgressionsAtDay(yearProgressModels: YearProgressModel[], dayMoment: Moment): ProgressionAtDayModel[] {

		const progressionsAtDay = [];

		_.forEach(this.selectedYears, (selectedYear: number) => {

			const yearProgressModel: YearProgressModel = _.find(yearProgressModels, {
				year: selectedYear
			});

			const progressionModel: ProgressionModel = _.find(yearProgressModel.progressions, {
				dayOfYear: dayMoment.dayOfYear()
			});

			if (progressionModel) {

				const progressAtDay: ProgressionAtDayModel = {
					date: dayMoment.year(progressionModel.year).toDate(),
					year: progressionModel.year,
					progressType: this.selectedProgressType.type,
					value: progressionModel.valueOf(this.selectedProgressType.type),
					color: this.yearProgressStyleModel.yearsColorsMap.get(progressionModel.year)
				};

				progressionsAtDay.push(progressAtDay);
			}
		});

		return progressionsAtDay;
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

	/**
	 *
	 * @param {MetricsGraphicsEventModel} mgEvent
	 */
	public onGraphMouseOver(mgEvent: MetricsGraphicsEventModel): void {

		// Seek date for multiple lines at first @ "mgEvent.key"
		// If not defined, it's a single line, then get date @ "mgEvent.date"
		this.momentWatched = moment(mgEvent.key || mgEvent.date);
		this.progressionsAtDay = this.findProgressionsAtDay(this.yearProgressModels, this.momentWatched);
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} event
	 */
	public onGraphMouseOut(event: MetricsGraphicsEventModel): void {
		this.momentWatched = this.todayMoment;
		this.progressionsAtDay = this.findProgressionsAtDay(this.yearProgressModels, this.todayMoment);
	}

	/**
	 *
	 */
	public onComponentSizeChanged(): void {
		this.draw();
	}

	public setupComponentSizeChangeHandlers(): void {

		this.windowResizingSubscription = this.windowService.resizing.subscribe(() => this.onComponentSizeChanged());

		// Or user toggles the side nav (open/close states)
		this.sideNavChangesSubscription = this.sideNavService.changes.subscribe(() => this.onComponentSizeChanged());

	}

	public setupGraphConfig(): void {

		this.graphConfig = {
			data: [],
			full_width: true,
			height: window.innerHeight * 0.55,
			right: 30,
			left: 70,
			baselines: [],
			animate_on_load: false,
			transition_on_update: false,
			aggregate_rollover: true,
			interpolate: d3.curveLinear,
			missing_is_hidden: true,
			missing_is_hidden_accessor: 'hidden',
			xax_count: 12,
			yax_count: 10,
			y_extended_ticks: true,
			target: "#" + YearProgressGraphComponent.GRAPH_DOM_ELEMENT_ID,
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1.1,
			showActivePoint: false,
			markers: [],
			legend: null,
			colors: [],
			yax_format: d3.format(""),
			max_data_size: 0,
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
