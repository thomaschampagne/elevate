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
// TODO Show helper info
// TODO Show info when no data. (Wrap in a parent FitnessTrendComponent 
// (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend-graph.component.html",
	styleUrls: ["./fitness-trend-graph.component.scss"]
})
export class FitnessTrendGraphComponent implements OnInit {

	public graphConfig = {
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
			this.openStravaActivities(dayFitnessTrend.ids);
		},
		mouseover: (data: { key: Date, values: any[] }, index: number, c: any) => {
			this.onMouseOverDate(data.key);
		},
		mouseout: () => {
			this.setTodayAsWatchedDay();
		}
	};

	public lastPeriods: LastPeriod[];

	public lastPeriodSelected: Period;
	public fitnessTrend: DayFitnessTrend[];
	public fitnessTrendLines: GraphPoint[][] = [];
	public markers: Marker[] = [];
	public watchedDay: DayFitnessTrend;

	public dateFrom: Date;
	public dateTo: Date;
	public dateMin: Date;
	public dateMax: Date;

	constructor(private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		// Generate graph data
		// TODO Recompute below line along power/swim changes
		const powerMeterEnable = null;
		const cyclingFtp = null;
		const swimEnable = null;
		const swimFtp = null;

		this.fitnessService.computeTrend(powerMeterEnable,
			cyclingFtp,
			swimEnable,
			swimFtp).then((fitnessTrend: DayFitnessTrend[]) => {

			this.fitnessTrend = fitnessTrend;
			this.lastPeriods = this.provideLastPeriods(this.fitnessTrend);
			this.lastPeriodSelected = _.find(this.lastPeriods, {key: "4_months"});

			this.init();

		});
	}

	/**
	 *
	 */
	private init(): void {

		this.setTodayAsWatchedDay();

		const fatigueLine: GraphPoint[] = [];
		const fitnessLine: GraphPoint[] = [];
		const formLine: GraphPoint[] = [];

		const today: string = moment().format(DayFitnessTrend.DATE_FORMAT);

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
						this.onMouseOverDate(dayFitnessTrend.date);
					},
					mouseout: () => {
						this.setTodayAsWatchedDay();
					},
					click: () => {
						this.openStravaActivities(dayFitnessTrend.ids);
					},
					label: "🠷" // or "▾" Found @ http://www.amp-what.com/
				};

			} else if (dayFitnessTrend.dateString === today) {
				marker = {
					date: new Date(),
					label: "☀" // or label: "☀️"
				};
			}

			if (!_.isNull(marker)) {
				this.markers.push(marker);
			}

		});

		// Push lines
		this.fitnessTrendLines.push(MG.convert.date(fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(formLine, "date"));
		// this.fitnessTrendLines.push(MG.convert.date(activeLine, 'date'));

		// Apply markers
		this.graphConfig.markers = this.markers;

		this.updateGraph(this.lastPeriodSelected /* TODO Remove and user directly in method no?!*/);
	}

	/**
	 *
	 * @param {number[]} ids
	 */
	private openStravaActivities(ids: number[]) {

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
		this.updateGraph(this.lastPeriodSelected);
	}

	public onDateToDateChange(): void {

		const period: Period = {
			from: this.dateFrom,
			to: this.dateTo
		};

		this.updateGraph(period);
	}

	/**
	 *
	 * @param {Period} period
	 */
	private updateGraph(period: Period): void {

		const _PERFORMANCE_MARKER_START_ = performance.now();

		// Apply lines changes
		this.graphConfig.data = this.computeTrendLinesRange(period);

		// Update dateFrom dateTo fields
		this.dateFrom = (_.isDate(period.from)) ? period.from : null;
		this.dateTo = (_.isDate(period.to)) ? period.to : moment().toDate();
		this.dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment().toDate();

		// Apply graph changes
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			console.debug("Graph update time: " + (performance.now() - _PERFORMANCE_MARKER_START_).toFixed(0) + " ms.");
		});
	}

	/**
	 *
	 * @param {Period} period
	 * @returns {GraphPoint[][]}
	 */
	private computeTrendLinesRange(period: Period): GraphPoint[][] {

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
	private onMouseOverDate(date: Date): void {

		// Update watched day
		this.watchedDay = this.getDayFitnessTrendFromDate(date);


		/*this.watchedDay = _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
		});
*/
		/*const isActiveDay = this.watchedDay.activitiesName.length > 0;
		if (isActiveDay) {

			// Cursor pointer to inform of click

		} else {

		}*/
	}

	/**
	 *
	 * @returns {DayFitnessTrend}
	 */
	private getTodayWatchedDay(): DayFitnessTrend {
		// return _.find(this.fitnessTrend, {
		// 	dateString: moment().format(DayFitnessTrend.DATE_FORMAT)
		// });
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

	private setTodayAsWatchedDay(): void {
		this.watchedDay = this.getTodayWatchedDay();
	}

	/**
	 *
	 * @param fitnessTrend
	 * @returns {LastPeriod[]}
	 */
	private provideLastPeriods(fitnessTrend: DayFitnessTrend[]): LastPeriod[] {

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
			from: moment(_.first(fitnessTrend).timestamp).toDate(),
			to: null,
			key: "beginning",
			label: "Since beginning"
		}];
	}
}
