import { Component, OnInit } from '@angular/core';
import { FitnessService, IPeriod } from "../services/fitness/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";
import * as d3 from "d3";
import { DayFitnessTrend } from "../models/fitness/DayFitnessTrend";

// DONE Filter by period until today
// DONE Filter between dates


// TODO Show graph point legend: CTL, ATL, TSB
// TODO Show graph point attributes: Act name, type, date | Trimp, PSS, SwimSS |
// TODO Show preview days as dashed line
// TODO Filter with power swim
// TODO Filter with power meter
// TODO Support form zones
// TODO Zoom in selection addon?!
// TODO Forward to strava.com activities
// TODO Show helper info
// TODO Show info when no data. (Wrap in a parent FitnessTrendComponent (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)


interface GraphPoint {
	date: string;
	value: number;
}

interface Marker {
	date: Date;
	label: string;
	click?: Function;
	mouseover?: Function;
}

/**
 * label: string;
 */
export interface ILastPeriod extends IPeriod {
	key: string;
	label: string;
}

@Component({
	selector: 'app-fitness-trend',
	templateUrl: './fitness-trend-graph.component.html',
	styleUrls: ['./fitness-trend-graph.component.scss']
})
export class FitnessTrendGraphComponent implements OnInit {

	private _graphConfig = {
		data: [],
		full_width: true,
		height: window.innerHeight * 0.60, //600, // Dynamic height?!
		right: 40,
		baselines: [{value: 0}],
		animate_on_load: true,
		transition_on_update: false,
		aggregate_rollover: true,
		interpolate: d3.curveLinear,
		// x_extended_ticks: true,
		// y_extended_ticks: true,
		yax_count: 10,
		target: '#fitnessTrendGraph',
		x_accessor: 'date',
		y_accessor: 'value',
		inflator: 1.2,
		showActivePoint: false,
		clickableMarkerLines: true,
		show_confidence_band: ['lower', 'upper'],
		markers: null,
		legend: null,
		click: function (data: { key: Date, values: any[] }, index: number) {
			console.log(data, index);
		},
		mouseover: (data: { key: Date, values: any[] }, index: number) => {
			this.onMouseOverDate(data.key);
		},
		mouseout: () => {
			this.watchedDay = this.getTodayWatchedDay();
		},
	};


	private _lastPeriods: ILastPeriod[];

	private _lastPeriodSelected: IPeriod;
	private _fitnessTrend: DayFitnessTrend[];
	private _fitnessTrendLines: GraphPoint[][] = [];
	private _markers: Marker[] = [];
	private _watchedDay: DayFitnessTrend;

	private _dateFrom: Date;
	private _dateTo: Date;
	private _dateMin: Date;
	private _dateMax: Date;

	constructor(private _fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		// Generate graph data
		this.fitnessService.computeTrend(null,
			null,
			null,
			null).then((fitnessTrend: DayFitnessTrend[]) => {

			this.fitnessTrend = fitnessTrend;
			this.watchedDay = this.getTodayWatchedDay();
			this.lastPeriods = this.provideLastPeriods(this.fitnessTrend);
			this.lastPeriodSelected = _.find(this._lastPeriods, {key: "4_months"});

			this.init();

		});
	}

	/**
	 *
	 */
	private init(): void {

		let fatigueLine: GraphPoint[] = [];
		let fitnessLine: GraphPoint[] = [];
		let formLine: GraphPoint[] = [];

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
					/*mouseout: () => {
						TODO Update metrics graphics
						this.onMouseOverDate(this.getTodayWatchedDay().date);
						this.watchedDay = this.getTodayWatchedDay();
					},*/
					click: () => {
						_.forEach(dayFitnessTrend.ids, (activityId: number) => {
							window.open("https://www.strava.com/activities/" + activityId, "_blank");
						});
					},
					label: "🠷" // or "▾" Found @ http://www.amp-what.com/
				};

			} else if (dayFitnessTrend.dateString == today) {
				marker = {
					date: new Date(),
					label: "☀"
					// label: "☀️"
				};
			}

			if (!_.isNull(marker)) {
				this.markers.push(marker);
			}

		});

		// Push lines
		this.fitnessTrendLines.push(MG.convert.date(fatigueLine, 'date'));
		this.fitnessTrendLines.push(MG.convert.date(fitnessLine, 'date'));
		this.fitnessTrendLines.push(MG.convert.date(formLine, 'date'));
		// this.fitnessTrendLines.push(MG.convert.date(activeLine, 'date'));

		// Apply markers
		this.graphConfig.markers = this.markers;

		this.updateGraph(this.lastPeriodSelected /* TODO Remove and user directly in method no?!*/);
	}

	/**
	 *
	 */
	public onLastPeriodSelected(): void {
		this.updateGraph(this.lastPeriodSelected);
	}

	public onDateToDateChange(): void {

		const period: IPeriod = {
			from: this.dateFrom,
			to: this.dateTo
		};

		this.updateGraph(period);
	}

	/**
	 *
	 * @param {Period} period
	 */
	private updateGraph(period: IPeriod): void {

		const _PERFORMANCE_MARKER_START_ = performance.now();

		// Apply lines changes
		this.graphConfig.data = this.computeTrendLinesRange(period);

		// Update dateFrom dateTo fields
		this.dateFrom = (_.isDate(period.from)) ? period.from : null;
		this.dateTo = (_.isDate(period.to)) ? period.to : moment().toDate();
		this._dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this._dateMax = moment().toDate();

		// Apply graph changes
		setTimeout(() => {
			MG.data_graphic(this.graphConfig);
			console.debug("Graph update time: " + (performance.now() - _PERFORMANCE_MARKER_START_).toFixed(0) + " ms.")
		});
	}

	/**
	 *
	 * @param {Period} period
	 * @returns {GraphPoint[][]}
	 */
	private computeTrendLinesRange(period: IPeriod): GraphPoint[][] {

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
		this.watchedDay = _.find(this.fitnessTrend, {
			dateString: moment(date).format(DayFitnessTrend.DATE_FORMAT)
		});
		// console.warn(this.watchedDay);

		/*const isActiveDay = this.watchedDay.activitiesName.length > 0;
		if (isActiveDay) {
			// TODO My stuff !
		}*/
	}

	/**
	 *
	 * @returns {DayFitnessTrend}
	 */
	private getTodayWatchedDay(): DayFitnessTrend {
		return _.find(this.fitnessTrend, {
			dateString: moment().format(DayFitnessTrend.DATE_FORMAT)
		});
	}

	/**
	 *
	 * @param fitnessTrend
	 * @returns {ILastPeriod[]}
	 */
	private provideLastPeriods(fitnessTrend: DayFitnessTrend[]): ILastPeriod[] {

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

	get graphConfig() {
		return this._graphConfig;
	}

	get lastPeriods(): ILastPeriod[] {
		return this._lastPeriods;
	}

	set lastPeriods(value: ILastPeriod[]) {
		this._lastPeriods = value;
	}

	get lastPeriodSelected(): IPeriod {
		return this._lastPeriodSelected;
	}

	set lastPeriodSelected(value: IPeriod) {
		this._lastPeriodSelected = value;
	}

	get fitnessService(): FitnessService {
		return this._fitnessService;
	}

	get fitnessTrend(): DayFitnessTrend[] {
		return this._fitnessTrend;
	}

	set fitnessTrend(value: DayFitnessTrend[]) {
		this._fitnessTrend = value;
	}

	get fitnessTrendLines(): GraphPoint[][] {
		return this._fitnessTrendLines;
	}

	get markers(): Marker[] {
		return this._markers;
	}

	get watchedDay(): DayFitnessTrend {
		return this._watchedDay;
	}

	set watchedDay(value: DayFitnessTrend) {
		this._watchedDay = value;
	}

	get dateFrom(): Date {
		return this._dateFrom;
	}

	set dateFrom(value: Date) {
		this._dateFrom = value;
	}

	get dateTo(): Date {
		return this._dateTo;
	}

	set dateTo(value: Date) {
		this._dateTo = value;
	}

	get dateMin(): Date {
		return this._dateMin;
	}

	set dateMin(value: Date) {
		this._dateMin = value;
	}

	get dateMax(): Date {
		return this._dateMax;
	}

	set dateMax(value: Date) {
		this._dateMax = value;
	}
}
