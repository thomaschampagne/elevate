import {
	Component,
	ElementRef,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
	ViewChild
} from "@angular/core";
import * as _ from "lodash";
import * as moment from "moment";
import * as d3 from "d3";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { PeriodModel } from "../shared/models/period.model";
import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "./models/marker.model";
import { MetricsGraphicsEventModel } from "../../shared/models/graphs/metrics-graphics-event.model";
import { MatDialog } from "@angular/material";
import { FitnessTrendComponent } from "../fitness-trend.component";
import { SideNavService } from "../../shared/services/side-nav/side-nav.service";
import { ViewableFitnessDataModel } from "./models/viewable-fitness-data.model";
import { Subscription } from "rxjs";
import { WindowService } from "../../shared/services/window/window.service";
import { ViewedDayService } from "../shared/services/viewed-day.service";

enum FITNESS_TRENDS_KEY_CODES {
	DOWN_ARROW = 40,
	RIGHT_ARROW = 39,
	UP_ARROW = 38,
	LEFT_ARROW = 37
}

@Component({
	selector: "app-fitness-trend-graph",
	templateUrl: "./fitness-trend-graph.component.html",
	styleUrls: ["./fitness-trend-graph.component.scss"]
})
export class FitnessTrendGraphComponent implements OnInit, OnChanges, OnDestroy {

	public static readonly SLIDE_PERIOD_VIEWED_DAYS: number = 14; // Days
	public static readonly ZOOM_PERIOD_VIEWED_DAYS: number = 14; // Days
	public static readonly TODAY_MARKER_LABEL: string = "Today";

	public static readonly GRAPH_HEIGHT_FACTOR_MEDIA_LG: number = 0.685;
	public static readonly GRAPH_HEIGHT_FACTOR_MEDIA_MD: number = FitnessTrendGraphComponent.GRAPH_HEIGHT_FACTOR_MEDIA_LG / 1.25;

	public PERFORMANCE_MARKER: number;

	public graphHeightFactor: number;
	public graphConfig: any;
	public viewableFitnessDataModel: ViewableFitnessDataModel;
	public viewedDay: DayFitnessTrendModel;

	public canPeriodViewedForward: boolean;
	public canPeriodViewedBackward: boolean;
	public canZoomInPeriodViewed: boolean;
	public canZoomOutPeriodViewed: boolean;

	public sideNavChangesSubscription: Subscription;
	public windowResizingSubscription: Subscription;

	@Input("dateMin")
	public dateMin: Date;

	@Input("dateMax")
	public dateMax: Date;

	@Input("periodViewed")
	public periodViewed: PeriodModel;

	@Input("isTrainingZonesEnabled")
	public isTrainingZonesEnabled;

	@Input("fitnessTrend")
	public fitnessTrend: DayFitnessTrendModel[];

	@ViewChild("viewedDayTooltip")
	public viewedDayTooltipElement: ElementRef;
	public viewedDayTooltipBounds: ClientRect = null;

	@ViewChild("fitnessTrendGraph")
	public fitnessTrendGraphElement: ElementRef;
	public fitnessTrendGraphBounds: ClientRect = null;

	public initialized = false;

	constructor(public sideNavService: SideNavService,
				public windowService: WindowService,
				public viewedDayService: ViewedDayService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {
		this.PERFORMANCE_MARKER = performance.now();
		this.findGraphHeightFactor();
		this.setup();
		this.initialized = true;
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		this.PERFORMANCE_MARKER = performance.now();

		if (changes.fitnessTrend) {
			this.setupViewableGraphData();
			this.updateGraph();

		} else if (changes.periodViewed || changes.isTrainingZonesEnabled) {
			this.updateGraph();
		}

	}

	/**
	 * Setup:
	 * Metrics graphics graph config
	 * Today as default viewed and broadcast to legend
	 * Lines & others viewable data
	 * First graph draw
	 * Listen for windows update
	 */
	public setup(): void {
		this.setupGraphConfig();
		this.setTodayAsViewedDay();
		this.setupViewableGraphData();
		this.updateGraph();
		this.setupComponentSizeChangeHandlers();
	}

	public setupViewableGraphData(): void {

		// Prepare viewable lines
		const today: string = moment().format(DayFitnessTrendModel.DATE_FORMAT);

		const markers: MarkerModel[] = [];

		const fatigueLine: GraphPointModel[] = [];
		const fitnessLine: GraphPointModel[] = [];
		const formLine: GraphPointModel[] = [];
		const previewFatigueLine: GraphPointModel[] = [];
		const previewFitnessLine: GraphPointModel[] = [];
		const previewFormLine: GraphPointModel[] = [];
		const activeLine: GraphPointModel[] = [];

		_.forEach(this.fitnessTrend, (dayFitnessTrend: DayFitnessTrendModel) => {

			// Real past fitness day
			fatigueLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.atl,
				hidden: dayFitnessTrend.previewDay
			});

			fitnessLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.ctl,
				hidden: dayFitnessTrend.previewDay
			});

			formLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.tsb,
				hidden: dayFitnessTrend.previewDay
			});

			// Preview future fitness day
			const isHiddenGraphPoint = (!dayFitnessTrend.previewDay && dayFitnessTrend.dateString !== today);
			previewFatigueLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.atl,
				hidden: isHiddenGraphPoint
			});

			previewFitnessLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.ctl,
				hidden: isHiddenGraphPoint
			});

			previewFormLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.tsb,
				hidden: isHiddenGraphPoint
			});

			activeLine.push({
				date: dayFitnessTrend.dateString,
				value: 0,
				hidden: false,
				active: dayFitnessTrend.hasActivities()
			});

			if (dayFitnessTrend.dateString === today) {
				const todayMarker = {
					date: moment().startOf("day").toDate(),
					label: FitnessTrendGraphComponent.TODAY_MARKER_LABEL
				};
				markers.push(todayMarker);
			}

		});

		this.viewableFitnessDataModel = new ViewableFitnessDataModel(
			markers,
			fatigueLine,
			fitnessLine,
			formLine,
			previewFatigueLine,
			previewFitnessLine,
			previewFormLine,
			activeLine
		);
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

	public draw(): void {

		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
		});
	}

	public setupComponentSizeChangeHandlers(): void {

		this.windowResizingSubscription = this.windowService.resizing.subscribe(() => {
			this.findGraphHeightFactor();
			this.onComponentSizeChanged();
			this.fitnessTrendGraphBounds = null; // Reset stored fitness graph bounds. It will be updated again by 'onTooltipMouseMove(event: MouseEvent)'
		});

		// Or user toggles the side nav (open/close states)
		this.sideNavChangesSubscription = this.sideNavService.changes.subscribe(() => this.onComponentSizeChanged());
	}

	public findGraphHeightFactor(): void {

		if (this.windowService.isScreenMediaActive(WindowService.SCREEN_MD)) {
			this.graphHeightFactor = FitnessTrendGraphComponent.GRAPH_HEIGHT_FACTOR_MEDIA_MD;
		} else {
			this.graphHeightFactor = FitnessTrendGraphComponent.GRAPH_HEIGHT_FACTOR_MEDIA_LG;
		}
	}

	public updateViewableData(): void {

		// Can we slide forward/backward the period viewed?
		this.canPeriodViewedBackward = this.canBackwardPeriodViewedOf(FitnessTrendGraphComponent.SLIDE_PERIOD_VIEWED_DAYS);
		this.canPeriodViewedForward = this.canForwardPeriodViewedOf(FitnessTrendGraphComponent.SLIDE_PERIOD_VIEWED_DAYS);
		this.canZoomInPeriodViewed = this.canZoomInPeriodViewedOf(FitnessTrendGraphComponent.ZOOM_PERIOD_VIEWED_DAYS);
		this.canZoomOutPeriodViewed = this.canZoomOutPeriodViewedOf(FitnessTrendGraphComponent.ZOOM_PERIOD_VIEWED_DAYS);

		const lines: GraphPointModel[][] = [];
		const indexes = this.indexesOf(this.periodViewed);

		_.forEach(this.viewableFitnessDataModel.fitnessTrendLines, (line: GraphPointModel[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		this.graphConfig.data = lines;
		this.graphConfig.markers = this.viewableFitnessDataModel.markers;
		this.graphConfig.baselines = this.viewableFitnessDataModel.getBaseLines(this.isTrainingZonesEnabled);

	}

	/**
	 * Return start/end indexes of fullFitnessTrend collection corresponding to from/to date given in a period
	 * @param {PeriodModel} period
	 * @returns {{start: number; end: number}}
	 */
	public indexesOf(period: PeriodModel): { start: number; end: number } {

		let startIndex = 0; // Use first day as start index by default.
		if (_.isDate(period.from)) { // Then override index if "From" is specified

			startIndex = _.findIndex(this.fitnessTrend, {
				dateString: moment(period.from).format(DayFitnessTrendModel.DATE_FORMAT)
			});

			if (startIndex === -1) {
				startIndex = 0;
			}
		}

		let endIndex = (this.fitnessTrend.length - 1); // Use last preview index by default
		if (_.isDate(period.to)) { // Then override index if "To" is specified
			endIndex = _.findIndex(this.fitnessTrend, {
				dateString: moment(period.to).format(DayFitnessTrendModel.DATE_FORMAT)
			});
		}

		if (endIndex === -1) {
			throw (new Error()).message = "No end activity index found for this TO date";
		}

		if (startIndex >= endIndex) {
			throw (new Error()).message = "FROM cannot be upper than TO date";
		}

		return {start: startIndex, end: endIndex};
	}

	public onPeriodViewedForward(): void {

		this.PERFORMANCE_MARKER = performance.now();

		const daysToForward: number = FitnessTrendGraphComponent.SLIDE_PERIOD_VIEWED_DAYS;
		if (!this.canForwardPeriodViewedOf(daysToForward)) {
			return;
		}
		this.periodViewed.from = moment(this.periodViewed.from).add(daysToForward, "days").toDate();
		this.periodViewed.to = moment(this.periodViewed.to).add(daysToForward, "days").toDate();
		this.updateGraph();

	}

	public onPeriodViewedBackward(): void {

		this.PERFORMANCE_MARKER = performance.now();

		const daysToRewind: number = FitnessTrendGraphComponent.SLIDE_PERIOD_VIEWED_DAYS;

		if (!this.canBackwardPeriodViewedOf(FitnessTrendGraphComponent.SLIDE_PERIOD_VIEWED_DAYS)) {
			return;
		}

		this.periodViewed.from = moment(this.periodViewed.from).subtract(daysToRewind, "days").toDate();
		this.periodViewed.to = moment(this.periodViewed.to).subtract(daysToRewind, "days").toDate();
		this.updateGraph();
	}

	public canForwardPeriodViewedOf(days: number): boolean {
		return !moment(this.periodViewed.to).add(days, "days").isAfter(this.dateMax);
	}

	public canBackwardPeriodViewedOf(days: number): boolean {
		return !moment(this.periodViewed.from).subtract(days, "days").isBefore(this.dateMin);
	}

	public onPeriodViewedZoomIn(): void {

		this.PERFORMANCE_MARKER = performance.now();

		const daysToCrop = FitnessTrendGraphComponent.ZOOM_PERIOD_VIEWED_DAYS;
		if (!this.canZoomInPeriodViewedOf(daysToCrop)) {
			return;
		}

		this.periodViewed.from = moment(this.periodViewed.from).add(daysToCrop, "days").toDate();
		this.updateGraph();
	}

	public onPeriodViewedZoomOut(): void {

		this.PERFORMANCE_MARKER = performance.now();

		const daysToCrop = FitnessTrendGraphComponent.ZOOM_PERIOD_VIEWED_DAYS;
		if (!this.canZoomOutPeriodViewedOf(daysToCrop)) {
			return;
		}

		this.periodViewed.from = moment(this.periodViewed.from).subtract(daysToCrop, "days").toDate();
		this.updateGraph();
	}

	public canZoomInPeriodViewedOf(days: number): boolean {
		return !moment(this.periodViewed.from).add(days, "days").isSameOrAfter(this.periodViewed.to);
	}

	public canZoomOutPeriodViewedOf(days: number): boolean {
		return !moment(this.periodViewed.from).subtract(days, "days").isBefore(this.dateMin);
	}

	public onGraphClick(metricsGraphicsEvent: MetricsGraphicsEventModel): void {
		const dayFitnessTrend = this.getDayFitnessTrendFromDate(metricsGraphicsEvent.key);
		FitnessTrendComponent.openActivities(dayFitnessTrend.ids);
	}

	public onGraphMouseOver(date: Date): void {
		this.viewedDay = this.getDayFitnessTrendFromDate(date);
		this.viewedDayService.onChange(this.viewedDay);
	}

	public onTooltipMouseMove(mouseEvent: MouseEvent): void {

		let mouseDistanceX = 50; // Default value in px. Can be changed below if tooltip goes out of the graph

		if (!this.fitnessTrendGraphBounds) {
			this.fitnessTrendGraphBounds = this.fitnessTrendGraphElement.nativeElement.getBoundingClientRect();
		}

		// Get tooltips bounds if not exists (or wrong width)
		if (!this.viewedDayTooltipBounds || this.viewedDayTooltipBounds.width === 0) {
			this.viewedDayTooltipBounds = this.viewedDayTooltipElement.nativeElement.getBoundingClientRect();
		}

		// Place tooltip left to the mouse cursor if she goes out of the graph
		const horizontalTooltipFlipThreshold = this.fitnessTrendGraphBounds.right - this.viewedDayTooltipBounds.width - mouseDistanceX;
		if (mouseEvent.clientX > horizontalTooltipFlipThreshold) {
			mouseDistanceX = (mouseDistanceX + this.viewedDayTooltipBounds.width) * -1;
		}

		// Finally set tooltip position
		this.viewedDayTooltipElement.nativeElement.style.left = (mouseEvent.clientX + mouseDistanceX) + "px";
		this.viewedDayTooltipElement.nativeElement.style.top = (mouseEvent.clientY - (this.viewedDayTooltipBounds.height / 2)) + "px";

	}

	public onGraphMouseOut(date: Date): void {
		this.setTodayAsViewedDay();
	}

	public getTodayViewedDay(): DayFitnessTrendModel {
		return this.getDayFitnessTrendFromDate(new Date());
	}

	public getDayFitnessTrendFromDate(date: Date): DayFitnessTrendModel {
		return _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrendModel.DATE_FORMAT)
		});
	}

	public setTodayAsViewedDay(): void {
		this.viewedDay = this.getTodayViewedDay();
		this.viewedDayService.onChange(this.viewedDay);
	}

	public onComponentSizeChanged(): void {
		this.PERFORMANCE_MARKER = performance.now();
		this.graphConfig.height = this.graphicHeight(); // Update graph dynamic height
		this.draw();
	}

	public graphicHeight(): number {
		return window.innerHeight * this.graphHeightFactor;
	}

	@HostListener("window:keydown", ["$event"])
	public onKeyDown(event: KeyboardEvent): void {

		event.preventDefault();
		event.stopPropagation();

		if (event.keyCode === FITNESS_TRENDS_KEY_CODES.RIGHT_ARROW) {
			this.onPeriodViewedForward();
		}

		if (event.keyCode === FITNESS_TRENDS_KEY_CODES.LEFT_ARROW) {
			this.onPeriodViewedBackward();
		}

		if (event.keyCode === FITNESS_TRENDS_KEY_CODES.UP_ARROW) {
			this.onPeriodViewedZoomIn();
		}

		if (event.keyCode === FITNESS_TRENDS_KEY_CODES.DOWN_ARROW) {
			this.onPeriodViewedZoomOut();
		}
	}

	public setupGraphConfig(): void {

		this.graphConfig = {
			data: [],
			full_width: true,
			height: this.graphicHeight(),
			top: 30,
			bottom: 30,
			right: 0,
			left: 30,
			baselines: [],
			animate_on_load: false,
			transition_on_update: false,
			aggregate_rollover: true,
			interpolate: d3.curveLinear,
			missing_is_hidden: true,
			max_data_size: 6,
			missing_is_hidden_accessor: "hidden",
			active_point_on_lines: true,
			active_point_size: 2.5,
			area: [false, false, true, false, false, true],
			flip_area_under_y_value: 0,
			point_size: 4,
			yax_count: 8,
			y_extended_ticks: true,
			target: "#fitnessTrendGraph",
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1.01,
			showActivePoint: false,
			markers: null,
			legend: null,
			click: (metricsGraphicsEvent: MetricsGraphicsEventModel) => {
				this.onGraphClick(metricsGraphicsEvent);
			},
			mouseover: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOver(data.key);
			},
			mouseout: (data: MetricsGraphicsEventModel) => {
				this.onGraphMouseOut(data.key);
			}
		};
	}

	public ngOnDestroy(): void {

		if (this.windowResizingSubscription) {
			this.windowResizingSubscription.unsubscribe();
		}

		if (this.sideNavChangesSubscription) {
			this.sideNavChangesSubscription.unsubscribe();
		}
	}
}
