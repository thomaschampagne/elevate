import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { FitnessService } from "../shared/service/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";
import * as d3 from "d3";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { PeriodModel } from "../shared/models/period.model";
import { LastPeriodModel } from "../shared/models/last-period.model";
import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "./models/marker.model";
import { UserSettingsModel } from "../../../../../common/scripts/models/UserSettings";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { MetricsGraphicsEventModel } from "../../shared/models/graphs/metrics-graphics-event.model";
import { MatDialog } from "@angular/material";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { FitnessInfoDialogComponent } from "./fitness-info-dialog/fitness-info-dialog.component";
import { FitnessTrendComponent } from "../fitness-trend.component";
import { SideNavService } from "../../shared/services/side-nav/side-nav.service";
import { ViewableFitnessDataModel } from "./models/viewable-fitness-data.model";
import { Subscription } from "rxjs/Subscription";
import { WindowService } from "../../shared/services/window/window.service";

@Component({
	selector: "app-fitness-trend-graph",
	templateUrl: "./fitness-trend-graph.component.html",
	styleUrls: ["./fitness-trend-graph.component.scss"]
})
export class FitnessTrendGraphComponent implements OnInit, OnDestroy {

	public static readonly DEFAULT_LAST_PERIOD_KEY: string = "6_months";

	public static readonly SPECIAL_CHAR_SUN: string = "☀"; // OR "☀️" @amp-what.com
	public static readonly SPECIAL_CHAR_FINGER: string = "🠷"; // OR "▾" @amp-what.com

	public static readonly LS_LAST_PERIOD_VIEWED_KEY: string = "fitnessTrend_lastPeriodViewed";
	public static readonly LS_POWER_METER_ENABLED_KEY: string = "fitnessTrend_powerMeterEnabled";
	public static readonly LS_SWIM_ENABLED_KEY: string = "fitnessTrend_swimEnabled";
	public static readonly LS_TRAINING_ZONES_ENABLED_KEY: string = "fitnessTrend_trainingZonesEnabled";

	public static findGraphicHeight(): number {
		return window.innerHeight * 0.55;
	}

	@Output("hasFitnessTrendDataNotify")
	public hasFitnessTrendDataNotify: EventEmitter<boolean> = new EventEmitter<boolean>();
	public hasFitnessTrendData: boolean = null; // Can be null because true/false state will assigned through asynchronous data fetching

	public readonly atlColor: string = "#515151";
	public readonly ctlColor: string = "#e94e1b";
	public readonly tsbColor: string = "#adadad";

	public PERFORMANCE_MARKER: number;

	public graphConfig: any;
	public graphReadyToBeDrawn: boolean = false;

	public lastPeriods: LastPeriodModel[];
	public periodViewed: PeriodModel;
	public lastPeriodViewed: LastPeriodModel;

	public fitnessTrend: DayFitnessTrendModel[];
	public viewableFitnessDataModel: ViewableFitnessDataModel;
	public viewedDay: DayFitnessTrendModel;

	public dateMin: Date;
	public dateMax: Date;

	public isTrainingZonesEnabled: boolean = false;
	public isPowerMeterEnabled: boolean = false;
	public cyclingFtp: number = null;
	public isSwimEnabled: boolean = false;
	public swimFtp: number = null;

	public sideNavChangesSubscription: Subscription;
	public windowResizingSubscription: Subscription;

	constructor(public userSettingsService: UserSettingsService,
				public fitnessService: FitnessService,
				public sideNavService: SideNavService,
				public windowService: WindowService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.PERFORMANCE_MARKER = performance.now();

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {

			this.cyclingFtp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;

			this.isTrainingZonesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LS_TRAINING_ZONES_ENABLED_KEY));
			this.isPowerMeterEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LS_POWER_METER_ENABLED_KEY)) && _.isNumber(this.cyclingFtp);
			this.isSwimEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LS_SWIM_ENABLED_KEY)) && _.isNumber(this.swimFtp);

			return this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);

		}).then((fitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fitnessTrend;
			this.hasFitnessTrendData = true;
			this.hasFitnessTrendDataNotify.emit(true);
			this.setup();

		}, error => {

			this.hasFitnessTrendData = false;
			this.hasFitnessTrendDataNotify.emit(false);
			console.warn(error);

		});
	}

	/**
	 * Setup:
	 * Default period viewed.
	 * Date picker min & max date
	 * Lines & marker viewable data
	 * First graph draw
	 */
	public setup(): void {

		this.setupGraphConfig();
		this.setupTimeData();
		this.setupViewableGraphData();
		this.updateGraph();
		this.setupComponentSizeChangeHandlers();
	}

	/**
	 * Re-compute fitness trends, and apply data to graph.
	 */
	private reloadGraph(): void {

		this.PERFORMANCE_MARKER = performance.now();

		this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp)
			.then((fitnessTrend: DayFitnessTrendModel[]) => {
				this.fitnessTrend = fitnessTrend;
				this.setupViewableGraphData();
				this.updateGraph();
			});
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		// Prepare viewable lines
		const today: string = moment().format(DayFitnessTrendModel.DATE_FORMAT);

		const markers: MarkerModel[] = [];

		const fatigueLine: GraphPointModel[] = [];
		const fitnessLine: GraphPointModel[] = [];
		const formLine: GraphPointModel[] = [];
		const previewFatigueLine: GraphPointModel[] = [];
		const previewFitnessLine: GraphPointModel[] = [];
		const previewFormLine: GraphPointModel[] = [];

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

			let marker: MarkerModel = null;

			const isActiveDay = dayFitnessTrend.activitiesName.length > 0;

			if (isActiveDay) {
				marker = {
					date: dayFitnessTrend.date,
					mouseover: () => this.onMarkerMouseOver(dayFitnessTrend),
					mouseout: () => this.onMarkerMouseOut(dayFitnessTrend),
					click: () => this.onMarkerClick(dayFitnessTrend),
					label: FitnessTrendGraphComponent.SPECIAL_CHAR_FINGER
				};
			} else if (dayFitnessTrend.dateString === today) {

				marker = {
					date: moment().startOf("day").toDate(),
					label: FitnessTrendGraphComponent.SPECIAL_CHAR_SUN
				};
			}

			if (!_.isNull(marker)) {
				markers.push(marker);
			}

		});

		this.viewableFitnessDataModel = new ViewableFitnessDataModel(
			markers,
			fatigueLine,
			fitnessLine,
			formLine,
			previewFatigueLine,
			previewFitnessLine,
			previewFormLine
		);
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
	public draw(): void {

		this.graphReadyToBeDrawn = true;
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
		});
	}

	/**
	 *
	 */
	public setupComponentSizeChangeHandlers(): void {

		this.windowResizingSubscription = this.windowService.resizing.subscribe(() => this.onComponentSizeChanged());

		// Or user toggles the side nav (open/close states)
		this.sideNavChangesSubscription = this.sideNavService.changes.subscribe(() => this.onComponentSizeChanged());
	}

	/**
	 *
	 */
	public updateViewableData(): void {

		const lines: GraphPointModel[][] = [];
		const indexes = this.fitnessService.indexesOf(this.periodViewed, this.fitnessTrend);

		_.forEach(this.viewableFitnessDataModel.fitnessTrendLines, (line: GraphPointModel[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		this.graphConfig.data = lines;
		this.graphConfig.markers = this.viewableFitnessDataModel.markers;
		this.graphConfig.baselines = this.viewableFitnessDataModel.getBaseLines(this.isTrainingZonesEnabled);
	}

	/**
	 *
	 */
	public onLastPeriodSelected(): void {
		this.PERFORMANCE_MARKER = performance.now();
		this.periodViewed = _.clone(this.lastPeriodViewed);
		localStorage.setItem(FitnessTrendGraphComponent.LS_LAST_PERIOD_VIEWED_KEY, this.lastPeriodViewed.key);
		this.updateGraph();
	}

	/**
	 *
	 */
	public onDateToDateChange(): void {
		this.PERFORMANCE_MARKER = performance.now();
		this.updateGraph();
	}

	/**
	 *
	 */
	private setupTimeData() {

		this.setTodayAsViewedDay();

		this.lastPeriods = this.provideLastPeriods();

		// Apply default last period
		const lastPeriodViewedSaved = localStorage.getItem(FitnessTrendGraphComponent.LS_LAST_PERIOD_VIEWED_KEY);
		this.lastPeriodViewed = _.find(this.lastPeriods, {
			key: (!_.isEmpty(lastPeriodViewedSaved) ? lastPeriodViewedSaved : FitnessTrendGraphComponent.DEFAULT_LAST_PERIOD_KEY)
		});

		// Assign last period to currently viewed
		this.periodViewed = _.clone(this.lastPeriodViewed);

		// Used by date pickers
		this.dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment(_.last(this.fitnessTrend).date).startOf("day").toDate();
	}

	/**
	 *
	 * @param {MetricsGraphicsEventModel} metricsGraphicsEvent
	 */
	private onGraphClick(metricsGraphicsEvent: MetricsGraphicsEventModel): void {
		const dayFitnessTrend = this.getDayFitnessTrendFromDate(metricsGraphicsEvent.key);
		FitnessTrendComponent.openActivities(dayFitnessTrend.ids);
	}

	/**
	 *
	 * @param {Date} date
	 */
	private onGraphMouseOver(date: Date): void {
		this.viewedDay = this.getDayFitnessTrendFromDate(date);
	}

	/**
	 *
	 * @param {Date} date
	 */
	private onGraphMouseOut(date: Date): void {
		this.setTodayAsViewedDay();
	}


	/**
	 *
	 * @param {DayFitnessTrendModel} dayFitnessTrend
	 */
	private onMarkerMouseOver(dayFitnessTrend: DayFitnessTrendModel): void {
		this.onGraphMouseOver(dayFitnessTrend.date);
	}

	/**
	 *
	 * @param {DayFitnessTrendModel} dayFitnessTrend
	 */
	private onMarkerMouseOut(dayFitnessTrend?: DayFitnessTrendModel): void {
		this.setTodayAsViewedDay();
	}

	/**
	 *
	 * @param {DayFitnessTrendModel} dayFitnessTrend
	 */
	private onMarkerClick(dayFitnessTrend: DayFitnessTrendModel): void {
		FitnessTrendComponent.openActivities(dayFitnessTrend.ids)
	}

	/**
	 * Provide today DayFitnessTrendModel
	 * @returns {DayFitnessTrendModel}
	 */
	private getTodayViewedDay(): DayFitnessTrendModel {
		return this.getDayFitnessTrendFromDate(new Date());
	}

	/**
	 *
	 * @param {Date} date
	 * @returns {DayFitnessTrendModel}
	 */
	private getDayFitnessTrendFromDate(date: Date): DayFitnessTrendModel {
		return _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrendModel.DATE_FORMAT)
		});
	}

	/**
	 * Assign viewed day to today
	 */
	private setTodayAsViewedDay(): void {
		this.viewedDay = this.getTodayViewedDay();
	}

	/**
	 *
	 */
	public onTrainingZonesToggle(): void {

		this.PERFORMANCE_MARKER = performance.now();

		this.updateGraph();

		if (this.isTrainingZonesEnabled) {
			localStorage.setItem(FitnessTrendGraphComponent.LS_TRAINING_ZONES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendGraphComponent.LS_TRAINING_ZONES_ENABLED_KEY);
		}
	}

	/**
	 *
	 */
	public onPowerMeterToggle(): void {

		this.PERFORMANCE_MARKER = performance.now();

		if (!_.isNumber(this.cyclingFtp)) {

			const data: GotItDialogDataModel = {
				title: "Cycling Functional Threshold Power Empty",
				content: "You cycling functional threshold power (FTP) is not defined. Please set it in athlete settings and go back to this page."
			};

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: data
			});

			// Reset toggle to false
			setTimeout(() => {
				this.isPowerMeterEnabled = false;
			});

		} else {

			this.reloadGraph();

			if (this.isPowerMeterEnabled) {
				localStorage.setItem(FitnessTrendGraphComponent.LS_POWER_METER_ENABLED_KEY, "true");
			} else {
				localStorage.removeItem(FitnessTrendGraphComponent.LS_POWER_METER_ENABLED_KEY);
			}
		}

	}

	/**
	 *
	 */
	public onSwimToggle(): void {

		this.PERFORMANCE_MARKER = performance.now();

		if (!_.isNumber(this.swimFtp)) {

			const data: GotItDialogDataModel = {
				title: "Swimming Functional Threshold Pace Empty",
				content: "Your swimming functional threshold pace is not defined. Please set it in athlete settings and go back to this page."
			};

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: data
			});

			// Reset toggle to false
			setTimeout(() => {
				this.isSwimEnabled = false;
			});

		} else {

			this.reloadGraph();

			if (this.isSwimEnabled) {
				localStorage.setItem(FitnessTrendGraphComponent.LS_SWIM_ENABLED_KEY, "true");
			} else {
				localStorage.removeItem(FitnessTrendGraphComponent.LS_SWIM_ENABLED_KEY);
			}
		}
	}

	/**
	 *
	 */
	public onComponentSizeChanged(): void {
		this.PERFORMANCE_MARKER = performance.now();
		this.graphConfig.height = FitnessTrendGraphComponent.findGraphicHeight(); // Update graph dynamic height
		this.draw();
	}

	/**
	 *
	 */
	public onShowInfo(): void {
		this.dialog.open(FitnessInfoDialogComponent, {
			minWidth: FitnessInfoDialogComponent.MIN_WIDTH,
			maxWidth: FitnessInfoDialogComponent.MAX_WIDTH,
		});
	}

	/**
	 *
	 */
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
			max_data_size: 6, // FIXME Really usefull?!
			missing_is_hidden_accessor: 'hidden',
			yax_count: 10,
			target: "#fitnessTrendGraph",
			x_accessor: "date",
			y_accessor: "value",
			inflator: 1.2,
			showActivePoint: false,
			markers: null,
			legend: null,
			custom_style: {
				lines: [
					{
						"stroke": this.atlColor, // Fatigue real
					},
					{
						"stroke": this.ctlColor, // Fitness real
					},
					{
						"stroke": this.tsbColor // Form real
					},
					{
						"stroke": this.atlColor, // Fatigue preview days
						"stroke-dasharray": "5, 5"
					},
					{
						"stroke": this.ctlColor, // Fitness preview days
						"stroke-dasharray": "5, 5"
					},
					{
						"stroke": this.tsbColor, // Form preview days
						"stroke-dasharray": "5, 5"
					}
				],
				circle_colors: [this.atlColor, this.ctlColor, this.tsbColor, this.atlColor, this.ctlColor, this.tsbColor]
			},
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

	/**
	 *
	 * @returns {LastPeriodModel[]}
	 */
	private provideLastPeriods(): LastPeriodModel[] {

		const toDate = moment().add(FitnessService.FUTURE_DAYS_PREVIEW, "days").startOf("day").toDate();

		return [{
			from: moment().startOf("day").subtract(7, "days").toDate(),
			to: toDate,
			key: "7_days",
			label: "7 days"
		}, {
			from: moment().startOf("day").subtract(14, "days").toDate(),
			to: toDate,
			key: "14_days",
			label: "14 days"
		}, {
			from: moment().startOf("day").subtract(1, "months").toDate(),
			to: toDate,
			key: "month",
			label: "30 days"
		}, {
			from: moment().startOf("day").subtract(6, "weeks").toDate(),
			to: toDate,
			key: "6_weeks",
			label: "6 weeks"
		}, {
			from: moment().startOf("day").subtract(2, "months").toDate(),
			to: toDate,
			key: "2_months",
			label: "2 months"
		}, {
			from: moment().startOf("day").subtract(4, "months").toDate(),
			to: toDate,
			key: "4_months",
			label: "4 months"
		}, {
			from: moment().startOf("day").subtract(6, "months").toDate(),
			to: toDate,
			key: "6_months",
			label: "6 months"
		}, {
			from: moment().startOf("day").subtract(9, "months").toDate(),
			to: toDate,
			key: "9_months",
			label: "9 months"
		}, {
			from: moment().startOf("day").subtract(1, "years").toDate(),
			to: toDate,
			key: "12_months",
			label: "12 months"
		}, {
			from: moment().startOf("day").subtract(18, "months").toDate(),
			to: toDate,
			key: "18_months",
			label: "18 months"
		}, {
			from: moment().startOf("day").subtract(2, "years").toDate(),
			to: toDate,
			key: "24_months",
			label: "24 months"
		}, {
			from: moment(_.first(this.fitnessTrend).timestamp).toDate(),
			to: toDate,
			key: "beginning",
			label: "Since beginning"
		}];
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
