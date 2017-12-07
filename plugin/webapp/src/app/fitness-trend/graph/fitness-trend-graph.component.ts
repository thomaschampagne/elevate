import { Component, OnInit } from "@angular/core";
import { FitnessService } from "../shared/service/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";
import * as d3 from "d3";
import { DayFitnessTrend } from "../shared/models/day-fitness-trend.model";
import { Period } from "../shared/models/period.model";
import { LastPeriod } from "../shared/models/last-period.model";
import { GraphPoint } from "./graph-point.model";
import { Marker } from "./marker.model";
import { IUserSettings } from "../../../../../common/scripts/interfaces/IUserSettings";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";

// DONE Filter by period until today
// DONE Filter between dates
// DONE Show graph point legend: CTL, ATL, TSB
// TODO Filter with power meter
// TODO Filter with power swim
// TODO Show graph point attributes: Act name, type, date | Trimp, PSS, SwimSS |
// TODO Show preview days as dashed line
// TODO Support form zones
// DONE Forward to strava.com activities
// TODO UI Style
// TODO training zones
// TODO Show helper info
// TODO Show info when no data. (Wrap in a parent FitnessTrendComponent
// (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)


class ViewableGraphData { // TODO Extract model

	public fatigueLine: GraphPoint[] = [];
	public fitnessLine: GraphPoint[] = [];
	public formLine: GraphPoint[] = [];
	public fitnessTrendLines: GraphPoint[][] = [];
	public markers: Marker[] = [];

	constructor(fatigueLine: GraphPoint[], fitnessLine: GraphPoint[], formLine: GraphPoint[], markers: Marker[]) {
		this.fatigueLine = fatigueLine;
		this.fitnessLine = fitnessLine;
		this.formLine = formLine;
		this.markers = markers;

		this.fitnessTrendLines.push(MG.convert.date(this.fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.formLine, "date"));
	}
}


@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend-graph.component.html",
	styleUrls: ["./fitness-trend-graph.component.scss"]
})
export class FitnessTrendGraphComponent implements OnInit {


	public static readonly DEFAULT_LAST_PERIOD_KEY: string = "4_months";

	public graphConfig = { // TODO Refactor with clean callbacks
		data: [],
		full_width: true,
		height: window.innerHeight * 0.60,
		right: 40,
		baselines: [{value: 0}],
		animate_on_load: true,
		transition_on_update: false,
		aggregate_rollover: true,
		interpolate: d3.curveLinear,
		// x_extended_ticks: true,
		// y_extended_ticks: true,
		yax_count: 10,
		target: "#fitnessTrendGraph",
		x_accessor: "date",
		y_accessor: "value",
		inflator: 1.2,
		showActivePoint: false,
		// clickableMarkerLines: true,
		show_confidence_band: ["lower", "upper"],
		markers: null,
		legend: null,
		click: (data: { key: Date, values: any[] }, index: number) => {
			const dayFitnessTrend = this.getDayFitnessTrendFromDate(data.key);
			this.openActivities(dayFitnessTrend.ids);
		},
		mouseover: (data: { key: Date, values: any[] }, index: number, c: any) => {
			this.onDayMouseOver(data.key);
		},
		mouseout: (data: { key: Date, values: any[] }) => {
			this.onDayMouseOut(data.key);
		}
	};

	public lastPeriods: LastPeriod[];
	public periodViewed: Period;
	public lastPeriodViewed: Period;

	public fitnessTrend: DayFitnessTrend[];
	// public markers: Marker[];
	// public fitnessTrendLines: GraphPoint[][];
	public viewableGraphData: ViewableGraphData;
	public viewedDay: DayFitnessTrend;

	// public dateFrom: Date;
	// public dateTo: Date;
	public dateMin: Date;
	public dateMax: Date;

	public isTrainingZonesEnabled: boolean = false;
	public isPowerMeterEnabled: boolean = false;
	public cyclingFtp: number = null;
	public isSwimEnabled: boolean = false;
	public swimFtp: number = null;


	constructor(private userSettingsService: UserSettingsService,
				private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		// Generate graph data
		// TODO Recompute below line along power/swim changes
		/*const powerMeterEnable = false;
		const cyclingFtp = null;
		const swimEnable = false;
		const swimFtp = null;*/
		// this.init();

		this.userSettingsService.fetch().then((userSettings: IUserSettings) => {

			this.cyclingFtp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;

			return this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);

		}).then((fitnessTrend: DayFitnessTrend[]) => {

			this.fitnessTrend = fitnessTrend;
			this.setup();
		});
	}

	/**
	 * TODO Comment
	 */
	private setup(): void {
		this.setupTimeData();
		this.setupViewableGraphData();
		this.updateGraph();
	}


	/**
	 * Re-compute fitness trends, and apply data to graph.
	 */
	private reload(): void {

		this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp)
			.then((fitnessTrend: DayFitnessTrend[]) => {

				this.fitnessTrend = fitnessTrend;
				this.setupViewableGraphData();
				this.updateGraph();

			});
	}

	/**
	 *
	 */
	private setupViewableGraphData(): void {

		const today: string = moment().format(DayFitnessTrend.DATE_FORMAT);

		const fatigueLine: GraphPoint[] = [];
		const fitnessLine: GraphPoint[] = [];
		const formLine: GraphPoint[] = [];
		const markers: Marker[] = [];

		_.forEach(this.fitnessTrend, (dayFitnessTrend: DayFitnessTrend) => {

			fatigueLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.atl
			});

			fitnessLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.ctl
			});

			formLine.push({
				date: dayFitnessTrend.dateString,
				value: dayFitnessTrend.tsb
			});

			let marker: Marker = null;

			const isActiveDay = dayFitnessTrend.activitiesName.length > 0;

			if (isActiveDay) {

				marker = {
					date: dayFitnessTrend.date,
					mouseover: () => {

						this.onMarkerMouseOver(dayFitnessTrend);
					},
					mouseout: () => {

						this.onMarkerMouseOut(dayFitnessTrend);
					},
					click: () => {

						this.onMarkerClick(dayFitnessTrend);
					},
					label: "🠷" // or "▾" Found @ http://www.amp-what.com/  // TODO static
				};

			} else if (dayFitnessTrend.dateString === today) {
				marker = {
					date: moment().startOf("day").toDate(),
					label: "☀" // or label: "☀️" // TODO static
				};
			}

			if (!_.isNull(marker)) {
				markers.push(marker);
			}

		});

		this.viewableGraphData = new ViewableGraphData(fatigueLine, fitnessLine, formLine, markers);
	}


	/**
	 *
	 */
	private updateGraph(): void {

		const _PERFORMANCE_MARKER_START_ = performance.now(); // TODO Move ealier to take care of compute trend

		try {

			// Apply changes
			this.updateViewableData();

			// Apply graph changes
			setTimeout(() => {
				MG.data_graphic(this.graphConfig);
				console.debug("Graph update time: " + (performance.now() - _PERFORMANCE_MARKER_START_).toFixed(0) + " ms.");
			});

		} catch (error) {
			console.warn(error);
		}

	}

	private updateViewableData(): void {

		const lines: GraphPoint[][] = [];
		const indexes = this.fitnessService.indexesOf(this.periodViewed, this.fitnessTrend);

		_.forEach(this.viewableGraphData.fitnessTrendLines, (line: GraphPoint[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		this.graphConfig.data = lines;
		this.graphConfig.markers = this.viewableGraphData.markers;
	}


	/**
	 *
	 */
	public onLastPeriodSelected(/*lastPeriod: Period*/): void {
		this.periodViewed = _.clone(this.lastPeriodViewed);
		this.updateGraph();
	}

	/**
	 *
	 */
	public onDateToDateChange(): void {

		/*	this.periodViewed = {
                from: this.dateFrom,
                to: this.dateTo
            };*/

		this.updateGraph();
	}


	/**
	 *
	 */
	private setupTimeData() {

		this.setTodayAsViewedDay();

		this.lastPeriods = this.provideLastPeriods();

		// Apply default last period
		this.lastPeriodViewed = _.find(this.lastPeriods, {key: FitnessTrendGraphComponent.DEFAULT_LAST_PERIOD_KEY});

		// Assign last period to currently viewed
		this.periodViewed = _.clone(this.lastPeriodViewed);

		// this.periodViewed.from = (_.isDate(this.periodViewed.from)) ? this.periodViewed.from : null;
		// this.periodViewed.to = (_.isDate(this.periodViewed.to)) ? this.periodViewed.to : moment().toDate();

		// Used by date pickers
		this.dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment().toDate();
	}

	/**
	 *
	 * @param {Date} date
	 */
	private onDayMouseOver(date: Date): void {

		// Update watched day
		this.viewedDay = this.getDayFitnessTrendFromDate(date);
		/*this.viewedDay = _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
		});*/
		/*const isActiveDay = this.viewedDay.activitiesName.length > 0;
		if (isActiveDay) {
			// Cursor pointer to inform of click
		} else {
		}*/
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
		return _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
		});
	}

	/**
	 * Assign viewed day to today
	 */
	private setTodayAsViewedDay(): void {
		this.viewedDay = this.getTodayViewedDay();
	}


	public onTrainingZonesToggle(): void {

		// this.init(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);
	}

	public onPowerMeterToggle(): void {
		this.reload();
		// this.init(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);
	}

	public onSwimToggle(): void {
		// this.init(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);
	}

	/**
	 *
	 * @param fitnessTrend
	 * @returns {LastPeriod[]}
	 */
	private provideLastPeriods(): LastPeriod[] {

		const todayDate = moment().startOf("day").toDate();

		return [{
			from: moment().startOf("day").subtract(7, "days").toDate(),
			to: todayDate,
			key: "7_days",
			label: "7 days"
		}, {
			from: moment().startOf("day").subtract(14, "days").toDate(),
			to: todayDate,
			key: "14_days",
			label: "14 days"
		}, {
			from: moment().startOf("day").subtract(1, "months").toDate(),
			to: todayDate,
			key: "month",
			label: "30 days"
		}, {
			from: moment().startOf("day").subtract(6, "weeks").toDate(),
			to: todayDate,
			key: "6_weeks",
			label: "6 weeks"
		}, {
			from: moment().startOf("day").subtract(2, "months").toDate(),
			to: todayDate,
			key: "2_months",
			label: "2 months"
		}, {
			from: moment().startOf("day").subtract(4, "months").toDate(),
			to: todayDate,
			key: "4_months",
			label: "4 months"
		}, {
			from: moment().startOf("day").subtract(6, "months").toDate(),
			to: todayDate,
			key: "6_months",
			label: "6 months"
		}, {
			from: moment().startOf("day").subtract(9, "months").toDate(),
			to: todayDate,
			key: "9_months",
			label: "9 months"
		}, {
			from: moment().startOf("day").subtract(1, "years").toDate(),
			to: todayDate,
			key: "12_months",
			label: "12 months"
		}, {
			from: moment().startOf("day").subtract(18, "months").toDate(),
			to: todayDate,
			key: "18_months",
			label: "18 months"
		}, {
			from: moment().startOf("day").subtract(2, "years").toDate(),
			to: todayDate,
			key: "24_months",
			label: "24 months"
		}, {
			from: moment(_.first(this.fitnessTrend).timestamp).toDate(),
			to: todayDate,
			key: "beginning",
			label: "Since beginning"
		}];
	}


}
