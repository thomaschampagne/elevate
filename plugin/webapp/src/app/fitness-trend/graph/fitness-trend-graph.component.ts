import { Component, OnInit } from "@angular/core";
import { FitnessService } from "../shared/service/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";
import * as d3 from "d3";
import { DayFitnessTrend } from "../shared/models/day-fitness-trend.model";
import { Period } from "../shared/models/period.model";
import { LastPeriod } from "../shared/models/last-period.model";
import { GraphPoint } from "./models/graph-point.model";
import { Marker } from "./models/marker.model";
import { IUserSettings } from "../../../../../common/scripts/interfaces/IUserSettings";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { ViewableGraphData } from "./models/viewable-graph-data.model";
import { MetricsGraphicsEvent } from "./models/metrics-graphics-event.model";
import { MatDialog } from "@angular/material";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogData } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

// DONE Filter by period until today
// DONE Filter between dates
// DONE Show graph point legend: CTL, ATL, TSB
// DONE Filter with power meter
// DONE Filter with power swim
// DONE Show graph point attributes: Act name, type, date | Trimp, PSS, SwimSS |
// DONE Alert on toogle click when no ftp or swmin confugured
// DONE Show preview days as dashed line
// DONE Support form zones
// DONE Forward to strava.com activities
// TODO UI Style
// DONE training zones
// TODO Show helper info
// TODO Show info sync when no data. (Wrap in a parent FitnessTrendComponent
// (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend-graph.component.html",
	styleUrls: ["./fitness-trend-graph.component.scss"]
})
export class FitnessTrendGraphComponent implements OnInit {

	public static readonly DEFAULT_LAST_PERIOD_KEY: string = "6_months";

	public static readonly SPECIAL_CHAR_SUN: string = "☀"; // OR "☀️" @amp-what.com
	public static readonly SPECIAL_CHAR_FINGER: string = "🠷"; // OR "▾" @amp-what.com

	public static readonly LS_LAST_PERIOD_VIEWED_KEY: string = "lastPeriodViewed";
	public static readonly LS_POWER_METER_ENABLED_KEY: string = "powerMeterEnabled";
	public static readonly LS_SWIM_ENABLED_KEY: string = "swimEnabled";
	public static readonly LC_TRAINING_ZONES_ENABLED_KEY: string = "trainingZonesEnabled";

	public PERFORMANCE_MARKER: number;

	public graphConfig = { // TODO Refactor with clean callbacks
		data: [],
		full_width: true,
		height: window.innerHeight * 0.60,
		right: 40,
		baselines: [],
		animate_on_load: false,
		transition_on_update: false,
		aggregate_rollover: true,
		interpolate: d3.curveLinear,
		missing_is_hidden: true,
		max_data_size: 6, // TODO ?!
		missing_is_hidden_accessor: 'hidden',
		// x_extended_ticks: true,
		// y_extended_ticks: true,
		yax_count: 10,
		target: "#fitnessTrendGraph",
		x_accessor: "date",
		y_accessor: "value",
		inflator: 1.2,
		showActivePoint: false,
		// clickableMarkerLines: true,
		// show_confidence_band: ["lower", "upper"],
		markers: null,
		legend: null,
		click: (data: MetricsGraphicsEvent) => {
			const dayFitnessTrend = this.getDayFitnessTrendFromDate(data.key);
			this.openActivities(dayFitnessTrend.ids);
		},
		mouseover: (data: MetricsGraphicsEvent) => {
			this.onDayMouseOver(data.key);
		},
		mouseout: (data: MetricsGraphicsEvent) => {
			this.onDayMouseOut(data.key);
		}
	};

	public lastPeriods: LastPeriod[];
	public periodViewed: Period;
	public lastPeriodViewed: LastPeriod;

	public fullFitnessTrend: DayFitnessTrend[]; // TODO rename fitnessTrend
	public viewableGraphData: ViewableGraphData;
	public viewedDay: DayFitnessTrend;

	public dateMin: Date;
	public dateMax: Date;

	public isTrainingZonesEnabled: boolean = false;
	public isPowerMeterEnabled: boolean = false;
	public cyclingFtp: number = null;
	public isSwimEnabled: boolean = false;
	public swimFtp: number = null;


	constructor(private userSettingsService: UserSettingsService,
				private fitnessService: FitnessService,
				private dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.PERFORMANCE_MARKER = performance.now();

		this.userSettingsService.fetch().then((userSettings: IUserSettings) => {

			this.cyclingFtp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;

			this.isTrainingZonesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LC_TRAINING_ZONES_ENABLED_KEY));
			this.isPowerMeterEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LS_POWER_METER_ENABLED_KEY)) && _.isNumber(this.cyclingFtp);
			this.isSwimEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendGraphComponent.LS_SWIM_ENABLED_KEY)) && _.isNumber(this.swimFtp);

			return this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);

		}).then((fullFitnessTrend: DayFitnessTrend[]) => {

			this.fullFitnessTrend = fullFitnessTrend;
			this.setup();
		});
	}

	/**
	 * Setup:
	 * Default period viewed.
	 * Date picker min & max date
	 * Lines & marker viewable data
	 * First graph draw
	 */
	private setup(): void {
		this.setupTimeData();
		this.setupViewableGraphData();
		this.updateGraph();
	}


	/**
	 * Re-compute fitness trends, and apply data to graph.
	 */
	private reloadGraph(): void {

		this.PERFORMANCE_MARKER = performance.now();

		this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp)
			.then((fullFitnessTrend: DayFitnessTrend[]) => {

				this.fullFitnessTrend = fullFitnessTrend;
				this.setupViewableGraphData();
				this.updateGraph();

			});
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		// Prepare viewable lines
		const today: string = moment().format(DayFitnessTrend.DATE_FORMAT);

		const markers: Marker[] = [];

		const fatigueLine: GraphPoint[] = [];
		const fitnessLine: GraphPoint[] = [];
		const formLine: GraphPoint[] = [];
		const previewFatigueLine: GraphPoint[] = [];
		const previewFitnessLine: GraphPoint[] = [];
		const previewFormLine: GraphPoint[] = [];

		_.forEach(this.fullFitnessTrend, (dayFitnessTrend: DayFitnessTrend) => {

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

			let marker: Marker = null;

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

		this.viewableGraphData = new ViewableGraphData(
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
	private updateGraph(): void {

		try {

			// Apply changes
			this.updateViewableData();

			// Apply graph changes
			setTimeout(() => {
				MG.data_graphic(this.graphConfig);
				console.log("Graph update time: " + (performance.now() - this.PERFORMANCE_MARKER).toFixed(0) + " ms.");
			});

		} catch (error) {
			console.warn(error);
		}

	}

	/**
	 *
	 */
	private updateViewableData(): void {

		const lines: GraphPoint[][] = [];
		const indexes = this.fitnessService.indexesOf(this.periodViewed, this.fullFitnessTrend);

		_.forEach(this.viewableGraphData.fitnessTrendLines, (line: GraphPoint[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		this.graphConfig.data = lines;
		this.graphConfig.markers = this.viewableGraphData.markers;
		this.graphConfig.baselines = this.viewableGraphData.getBaseLines(this.isTrainingZonesEnabled);
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
		this.dateMin = moment(_.first(this.fullFitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment(_.last(this.fullFitnessTrend).date).startOf("day").toDate();
	}

	/**
	 *
	 * @param {Date} date
	 */
	private onDayMouseOver(date: Date): void {
		this.viewedDay = this.getDayFitnessTrendFromDate(date);
	}

	/**
	 *
	 * @param {Date} date
	 */
	private onDayMouseOut(date: Date): void {
		this.setTodayAsViewedDay();
	}


	/**
	 *
	 * @param {DayFitnessTrend} dayFitnessTrend
	 */
	private onMarkerMouseOver(dayFitnessTrend: DayFitnessTrend): void {
		this.onDayMouseOver(dayFitnessTrend.date);
	}

	/**
	 *
	 * @param {DayFitnessTrend} dayFitnessTrend
	 */
	private onMarkerMouseOut(dayFitnessTrend?: DayFitnessTrend): void {
		this.setTodayAsViewedDay();
	}

	/**
	 *
	 * @param {DayFitnessTrend} dayFitnessTrend
	 */
	private onMarkerClick(dayFitnessTrend: DayFitnessTrend): void {
		this.openActivities(dayFitnessTrend.ids)
	}


	/**
	 *
	 * @param {number[]} ids
	 */
	private openActivities(ids: number[]) {

		if (ids.length > 0) {
			const url = "https://www.strava.com/activities/{activityId}"; // TODO Move to be used elsewhere?! Table as instance
			_.forEach(ids, (id: number) => {
				window.open(url.replace("{activityId}", id.toString()), "_blank");
			});
		} else {
			console.warn("No activities found");
		}
	}

	/**
	 * Provide today DayFitnessTrend
	 * @returns {DayFitnessTrend}
	 */
	private getTodayViewedDay(): DayFitnessTrend {
		return this.getDayFitnessTrendFromDate(new Date());
	}

	/**
	 *
	 * @param {Date} date
	 * @returns {DayFitnessTrend}
	 */
	private getDayFitnessTrendFromDate(date: Date): DayFitnessTrend {
		return _.find(this.fullFitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
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
			localStorage.setItem(FitnessTrendGraphComponent.LC_TRAINING_ZONES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendGraphComponent.LC_TRAINING_ZONES_ENABLED_KEY);
		}
	}

	/**
	 *
	 */
	public onPowerMeterToggle(): void {

		this.PERFORMANCE_MARKER = performance.now();

		if (!_.isNumber(this.cyclingFtp)) {

			const data: GotItDialogData = {
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

			const data: GotItDialogData = {
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
	 * @returns {LastPeriod[]}
	 */
	private provideLastPeriods(): LastPeriod[] {

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
			from: moment(_.first(this.fullFitnessTrend).timestamp).toDate(),
			to: toDate,
			key: "beginning",
			label: "Since beginning"
		}];
	}


}
