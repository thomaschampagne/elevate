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
	public markers: Marker[] = [];

	constructor(fatigueLine: GraphPoint[], fitnessLine: GraphPoint[], formLine: GraphPoint[], markers: Marker[]) {
		this.fatigueLine = fatigueLine;
		this.fitnessLine = fitnessLine;
		this.formLine = formLine;
		this.markers = markers;
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
			this.onMouseOver(data.key);
		},
		mouseout: () => {
			this.setTodayAsWatchedDay();
		}
	};

	public lastPeriods: LastPeriod[];

	public lastPeriodSelected: Period;
	public fitnessTrend: DayFitnessTrend[];
	public fitnessTrendLines: GraphPoint[][];
	public markers: Marker[];
	public watchedDay: DayFitnessTrend;

	public dateFrom: Date;
	public dateTo: Date;
	public dateMin: Date;
	public dateMax: Date;

	public isTrainingZonesEnabled: boolean = false;
	public isPowerMeterEnabled: boolean = true;
	public cyclingFtp: number = null;
	public isSwimEnabled: boolean = false;
	public swimFtp: number = null;


	constructor(private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		// Generate graph data
		// TODO Recompute below line along power/swim changes
		/*const powerMeterEnable = false;
		const cyclingFtp = null;
		const swimEnable = false;
		const swimFtp = null;*/
		// this.init();

		this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp)
			.then((fitnessTrend: DayFitnessTrend[]) => {

				this.fitnessTrend = fitnessTrend;

				this.setup();
			});
	}


	/*private init(isPowerMeterEnabled: boolean, cyclingFtp: number, isSwimEnabled: boolean, swimFtp: number) {


	}*/

	/**
	 * TODO
	 */
	private setup(): void {

		this.lastPeriods = this.provideLastPeriods();

		this.lastPeriodSelected = _.find(this.lastPeriods, {key: FitnessTrendGraphComponent.DEFAULT_LAST_PERIOD_KEY});

		this.setTodayAsWatchedDay();

		this.updateDateFromTo();

		const viewableGraphData: ViewableGraphData = this.makeViewableGraphData((dayFitnessTrend: DayFitnessTrend) => {
				this.onMouseOver(dayFitnessTrend.date);
			},
			() => {
				this.setTodayAsWatchedDay();
			},
			(dayFitnessTrend: DayFitnessTrend) => {
				this.openActivities(dayFitnessTrend.ids);
			}
		);

		// Push lines
		this.fitnessTrendLines = [];
		this.fitnessTrendLines.push(MG.convert.date(viewableGraphData.fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(viewableGraphData.fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(viewableGraphData.formLine, "date"));
		this.markers = viewableGraphData.markers;

		this.updateGraph();
	}


	/**
	 *
	 * @param {(dayFitnessTrend: DayFitnessTrend) => void} onMarkerMouseOver
	 * @param {(dayFitnessTrend: DayFitnessTrend) => void} onMarkerMouseOut
	 * @param {(dayFitnessTrend: DayFitnessTrend) => void} onMarkerClick
	 * @returns {ViewableGraphData}
	 */
	private makeViewableGraphData(onMarkerMouseOver: (dayFitnessTrend: DayFitnessTrend) => void,
								  onMarkerMouseOut: (dayFitnessTrend: DayFitnessTrend) => void,
								  onMarkerClick: (dayFitnessTrend: DayFitnessTrend) => void): ViewableGraphData {

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

						if (onMarkerMouseOver) {
							onMarkerMouseOver(dayFitnessTrend);
						}
					},
					mouseout: () => {

						if (onMarkerMouseOut) {
							onMarkerMouseOut(dayFitnessTrend);
						}
					},
					click: () => {

						if (onMarkerClick) {
							onMarkerClick(dayFitnessTrend);
						}
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

		return new ViewableGraphData(fatigueLine, fitnessLine, formLine, markers);
	}

	/**
	 * Re-compute fitness trends, and apply data to graph.
	 */
	private reload(): void {
		this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp)
			.then((fitnessTrend: DayFitnessTrend[]) => {
				this.fitnessTrend = fitnessTrend;
				// TODO ............
				console.warn("reload with", this.fitnessTrend);
			});
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
	 *
	 */
	public onLastPeriodSelected(): void {
		this.updateGraph();
	}

	/**
	 *
	 */
	public onDateToDateChange(): void {

		const period: Period = {
			from: this.dateFrom,
			to: this.dateTo
		};

		this.updateGraph(period);
	}

	/**
	 *
	 */
	private updateGraph(period?: Period): void {

		period = (_.isEmpty(period)) ? this.lastPeriodSelected : period;

		const _PERFORMANCE_MARKER_START_ = performance.now();

		// Apply changes
		this.graphConfig.data = this.linesRangeFromPeriod(period);
		this.graphConfig.markers = this.markers;

		// Apply graph changes
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			console.debug("Graph update time: " + (performance.now() - _PERFORMANCE_MARKER_START_).toFixed(0) + " ms.");
		});
	}

	/**
	 *
	 * @param {Period} period
	 */
	private updateDateFromTo(period?: Period) {

		period = (_.isEmpty(period)) ? this.lastPeriodSelected : period;

		this.dateFrom = (_.isDate(period.from)) ? period.from : null;
		this.dateTo = (_.isDate(period.to)) ? period.to : moment().toDate();
		this.dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment().toDate();
	}

	/**
	 *
	 * @param {Period} period
	 * @returns {GraphPoint[][]}
	 */
	private linesRangeFromPeriod(period: Period): GraphPoint[][] {

		const lines: GraphPoint[][] = [];
		const indexes = this.fitnessService.indexesOf(period, this.fitnessTrend);

		_.forEach(this.fitnessTrendLines, (line: GraphPoint[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		return lines;
	}

	/**
	 *
	 * @param {string} date format YYYY-MM-DD
	 */
	private onMouseOver(date: Date): void {

		// Update watched day
		this.watchedDay = this.getDayFitnessTrendFromDate(date);
		/*this.watchedDay = _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
		});*/
		/*const isActiveDay = this.watchedDay.activitiesName.length > 0;
		if (isActiveDay) {
			// Cursor pointer to inform of click
		} else {
		}*/
	}

	/**
	 * Provide today DayFitnessTrend
	 * @returns {DayFitnessTrend}
	 */
	private getTodayWatchedDay(): DayFitnessTrend {
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
	 * Assign watched day to today
	 */
	private setTodayAsWatchedDay(): void {
		this.watchedDay = this.getTodayWatchedDay();
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

		return [{
			from: moment().subtract(7, "days").toDate(),
			to: null,
			key: "7_days",
			label: "7 days"
		}, {
			from: moment().subtract(14, "days").toDate(),
			to: null,
			key: "14_days",
			label: "14 days"
		}, {
			from: moment().subtract(1, "months").toDate(),
			to: null,
			key: "month",
			label: "30 days"
		}, {
			from: moment().subtract(6, "weeks").toDate(),
			to: null,
			key: "6_weeks",
			label: "6 weeks"
		}, {
			from: moment().subtract(2, "months").toDate(),
			to: null,
			key: "2_months",
			label: "2 months"
		}, {
			from: moment().subtract(4, "months").toDate(),
			to: null,
			key: "4_months",
			label: "4 months"
		}, {
			from: moment().subtract(6, "months").toDate(),
			to: null,
			key: "6_months",
			label: "6 months"
		}, {
			from: moment().subtract(9, "months").toDate(),
			to: null,
			key: "9_months",
			label: "9 months"
		}, {
			from: moment().subtract(1, "years").toDate(),
			to: null,
			key: "12_months",
			label: "12 months"
		}, {
			from: moment().subtract(18, "months").toDate(),
			to: null,
			key: "18_months",
			label: "18 months"
		}, {
			from: moment().subtract(2, "years").toDate(),
			to: null,
			key: "24_months",
			label: "24 months"
		}, {
			from: moment(_.first(this.fitnessTrend).timestamp).toDate(),
			to: null,
			key: "beginning",
			label: "Since beginning"
		}];
	}

}
