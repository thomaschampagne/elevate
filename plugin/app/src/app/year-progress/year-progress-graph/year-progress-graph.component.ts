import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { YearProgressStyleModel } from "./models/year-progress-style.model";
import { ViewableYearProgressDataModel } from "./models/viewable-year-progress-data.model";
import * as moment from "moment";
import { Moment } from "moment";
import * as _ from "lodash";
import { YearProgressModel } from "../shared/models/year-progress.model";
import { ProgressModel } from "../shared/models/progress.model";
import * as d3 from "d3";
import { MetricsGraphicsEventModel } from "../../shared/models/graphs/metrics-graphics-event.model";
import { ProgressType } from "../shared/enums/progress-type.enum";
import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import { Subscription } from "rxjs";
import { WindowService } from "../../shared/services/window/window.service";
import { SideNavService } from "../../shared/services/side-nav/side-nav.service";
import { YearProgressService } from "../shared/services/year-progress.service";
import { TargetProgressModel } from "../shared/models/target-progress.model";

@Component({
	selector: "app-year-progress-graph",
	templateUrl: "./year-progress-graph.component.html",
	styleUrls: ["./year-progress-graph.component.scss"]
})
export class YearProgressGraphComponent implements OnInit, OnChanges, OnDestroy {

	public static readonly GRAPH_DOM_ELEMENT_ID: string = "yearProgressGraph";
	public static readonly GRAPH_WRAPPER_DOM_ELEMENT_ID: string = "graphWrapper";
	public static readonly GRAPH_TARGET_LINE_COLOR: string = "grey";

	public readonly ProgressType = ProgressType;

	constructor(public yearProgressService: YearProgressService,
				public sideNavService: SideNavService,
				public windowService: WindowService) {
	}

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressions")
	public yearProgressions: YearProgressModel[];

	@Input("targetProgressModels")
	public targetProgressModels: TargetProgressModel[];

	@Input("yearProgressStyleModel")
	public yearProgressStyleModel: YearProgressStyleModel;

	public viewableYearProgressDataModel: ViewableYearProgressDataModel;
	public graphConfig: any;
	public isMomentWatchedToday: boolean;
	public sideNavChangesSubscription: Subscription;
	public windowResizingSubscription: Subscription;
	public isGraphDataReadyOnYearChange = false;
	public initialized = false;

	public static findGraphicHeight(): number {
		return window.innerHeight * 0.65;
	}

	public static clearSvgGraphContent(): void {
		const svgElement = document.getElementById(YearProgressGraphComponent.GRAPH_DOM_ELEMENT_ID).children[0];
		if (svgElement) {
			svgElement.remove();
		}
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

		// Prepare years lines
		const yearLines: GraphPointModel[][] = [];

		_.forEach(this.yearProgressions, (yearProgressModel: YearProgressModel) => {

			const isYearSelected = (_.indexOf(this.selectedYears, yearProgressModel.year) !== -1);

			if (isYearSelected) {

				const yearLine: GraphPointModel[] = [];

				_.forEach(yearProgressModel.progressions, (progressModel: ProgressModel) => {

					const graphPoint: Partial<GraphPointModel> = {
						date: moment().dayOfYear(progressModel.dayOfYear).format("YYYY-MM-DD"),
						hidden: progressModel.isFuture
					};

					switch (this.selectedProgressType.type) {
						case ProgressType.DISTANCE:
							graphPoint.value = progressModel.distance;
							break;

						case ProgressType.TIME:
							graphPoint.value = progressModel.time;
							break;

						case ProgressType.ELEVATION:
							graphPoint.value = progressModel.elevation; // meters
							break;

						case ProgressType.COUNT:
							graphPoint.value = progressModel.count;
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

		// Prepare target line
		if (this.targetProgressModels) {

			const targetLine: GraphPointModel[] = [];

			_.forEach(this.targetProgressModels, (targetProgressModel: TargetProgressModel) => {

				const graphPoint: Partial<GraphPointModel> = {
					date: moment().dayOfYear(targetProgressModel.dayOfYear).format("YYYY-MM-DD"),
					value: targetProgressModel.value,
					hidden: false
				};

				targetLine.push(graphPoint as GraphPointModel);

			});

			this.viewableYearProgressDataModel.setGraphicsTargetLine(targetLine);

		} else {
			this.viewableYearProgressDataModel.setGraphicsTargetLine([]);
		}

	}

	public updateGraph(partialUpdate?: boolean): void {
		try {
			// Apply changes
			this.updateViewableData(partialUpdate);

			// Apply graph changes
			this.draw();

		} catch (error) {
			console.warn(error);
		}
	}

	public updateViewableData(partialUpdate?: boolean): void {

		this.graphConfig.markers = this.viewableYearProgressDataModel.markers;

		if (partialUpdate === true) {
			return;
		}

		this.graphConfig.data = this.viewableYearProgressDataModel.yearLines;
		this.graphConfig.colors = this.colorsOfSelectedYears(this.selectedYears);
		this.graphConfig.markers = this.viewableYearProgressDataModel.markers;

		// Has target progress?
		if (this.targetProgressModels) {
			this.graphConfig.data.unshift(this.viewableYearProgressDataModel.targetLine); // Append first target progress
			this.graphConfig.colors.unshift(YearProgressGraphComponent.GRAPH_TARGET_LINE_COLOR); // Append first target line color
		}

		this.graphConfig.max_data_size = this.graphConfig.data.length;

	}

	public draw(): void {
		_.defer(() => {
			MG.data_graphic(this.graphConfig);
			this.isGraphDataReadyOnYearChange = true;
		});
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
		this.updateGraph(true);
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
		this.updateGraph(true);
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
