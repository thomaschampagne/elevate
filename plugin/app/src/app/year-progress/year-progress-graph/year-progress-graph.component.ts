import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { YearProgressStyleModel } from "./models/year-progress-style.model";
import { ViewableYearProgressDataModel } from "./models/viewable-year-progress-data.model";
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
import { YearProgressService } from "../shared/services/year-progress.service";

@Component({
	selector: "app-year-progress-graph",
	templateUrl: "./year-progress-graph.component.html",
	styleUrls: ["./year-progress-graph.component.scss"]
})
export class YearProgressGraphComponent implements OnInit, OnChanges, OnDestroy {

	public static readonly GRAPH_DOM_ELEMENT_ID: string = "yearProgressGraph";
	public static readonly GRAPH_WRAPPER_DOM_ELEMENT_ID: string = "graphWrapper";

	public static findGraphicHeight(): number {
		return window.innerHeight * 0.675;
	}

	public readonly ProgressType = ProgressType;

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressModels")
	public yearProgressModels: YearProgressModel[];

	@Input("yearProgressStyleModel")
	public yearProgressStyleModel: YearProgressStyleModel;

	public viewableYearProgressDataModel: ViewableYearProgressDataModel;
	public graphConfig: any;
	public isMomentWatchedToday: boolean;

	public sideNavChangesSubscription: Subscription;
	public windowResizingSubscription: Subscription;

	public isGraphDataReadyOnYearChange = false;

	public initialized = false;

	constructor(public yearProgressService: YearProgressService,
				public sideNavService: SideNavService,
				public windowService: WindowService) {
	}

	public ngOnInit(): void {

		this.viewableYearProgressDataModel = new ViewableYearProgressDataModel();

		// By default progression shown at marker is today
		const defaultMarkerMoment = this.yearProgressService.momentWatched;
		this.viewableYearProgressDataModel.setMarkerMoment(defaultMarkerMoment);

		this.isMomentWatchedToday = this.isMomentToday(defaultMarkerMoment);

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
			this.isGraphDataReadyOnYearChange = false;
		}

		// Always re-draw svg content
		this.reloadGraph();
	}


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


	public updateViewableData(): void {

		this.graphConfig.data = this.viewableYearProgressDataModel.yearLines;
		this.graphConfig.max_data_size = this.graphConfig.data.length;
		this.graphConfig.colors = this.colorsOfSelectedYears(this.selectedYears);
		this.graphConfig.markers = this.viewableYearProgressDataModel.markers;

	}


	public draw(): void {
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			this.isGraphDataReadyOnYearChange = true;
		});
	}

	public static clearSvgGraphContent(): void {
		const svgElement = document.getElementById(YearProgressGraphComponent.GRAPH_DOM_ELEMENT_ID).children[0];
		if (svgElement) {
			svgElement.remove();
		}
	}


	public reloadGraph(): void {
		this.setupViewableGraphData();
		this.updateGraph();
	}

	/**
	 *
	 * @param {number[]} yearSelection
	 * @returns {string[]}
	 */
	public colorsOfSelectedYears(yearSelection: number[]): string[] {

		const colors = [];
		_.forEachRight(yearSelection, (year: number) => {
			colors.push(this.yearProgressStyleModel.yearsColorsMap.get(year));
		});
		return colors;
	}

	/**
	 * Tell you if moment given is today without taking care of the year
	 * @param {moment.Moment} pMoment
	 * @returns {boolean}
	 */
	public isMomentToday(pMoment: Moment) {
		return (pMoment.dayOfYear() === moment().dayOfYear());
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} mgEvent
	 */
	public onGraphClick(mgEvent: MetricsGraphicsEventModel): void {
		const momentWatched = moment(mgEvent.key || mgEvent.date);
		this.viewableYearProgressDataModel.setMarkerMoment(momentWatched);
		this.updateGraph();
		this.isMomentWatchedToday = this.isMomentToday(momentWatched);
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} mgEvent
	 */
	public onGraphMouseOver(mgEvent: MetricsGraphicsEventModel): void {
		// Seek date for multiple lines at first @ "mgEvent.key"
		// If not defined, it's a single line, then get date @ "mgEvent.date"
		const momentWatched = moment(mgEvent.key || mgEvent.date);
		this.yearProgressService.onMomentWatchedChange(momentWatched);
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} event
	 */
	public onGraphMouseOut(): void {
		const momentWatched = this.viewableYearProgressDataModel.getMarkerMoment();
		this.yearProgressService.onMomentWatchedChange(momentWatched);
	}

	public onResetMomentWatched(): void {
		const defaultMomentWatched = this.yearProgressService.resetMomentWatched();
		this.viewableYearProgressDataModel.setMarkerMoment(defaultMomentWatched);
		this.updateGraph();
		this.isMomentWatchedToday = this.isMomentToday(defaultMomentWatched);
	}

	public onComponentSizeChanged(): void {

		// Update graph dynamic height
		this.applyGraphHeight();

		// Re-draw
		this.draw();
	}

	public setupComponentSizeChangeHandlers(): void {

		// User resize window
		this.windowResizingSubscription = this.windowService.resizing.subscribe(() => this.onComponentSizeChanged());

		// Or user toggles the side nav (open/close states)
		this.sideNavChangesSubscription = this.sideNavService.changes.subscribe(() => this.onComponentSizeChanged());
	}

	public setupGraphConfig(): void {

		this.graphConfig = {
			data: [],
			full_width: true,
			height: -1, // Applied by applyGraphHeight
			top: 20,
			right: 15,
			left: 70,
			baselines: [],
			animate_on_load: false,
			transition_on_update: false,
			aggregate_rollover: true,
			interpolate: d3.curveLinear,
			missing_is_hidden: true,
			missing_is_hidden_accessor: "hidden",
			xax_count: 12,
			yax_count: 10,
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
			click: (metricsGraphicsEvent: MetricsGraphicsEventModel) => {
				this.onGraphClick(metricsGraphicsEvent);
			},
			mouseover: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOver(data);
			},
			mouseout: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOut();
			}
		};

		this.applyGraphHeight();
	}

	public applyGraphHeight(): void {
		const height: number = YearProgressGraphComponent.findGraphicHeight();
		this.graphConfig.height = height;
		document.getElementById(YearProgressGraphComponent.GRAPH_WRAPPER_DOM_ELEMENT_ID).style.height = height + "px";
	}

	public ngOnDestroy(): void {
		this.windowResizingSubscription.unsubscribe();
		this.sideNavChangesSubscription.unsubscribe();
	}

}
