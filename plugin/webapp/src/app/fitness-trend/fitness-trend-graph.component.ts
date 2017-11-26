import { Component, OnInit } from '@angular/core';
import { FitnessService, IDayFitnessTrend, IPeriod } from "../services/fitness/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";

// DONE Filter by period until today
// DONE Filter between dates
// TODO Forward to strava.com activities
// TODO Show graph point legend: CTL, ATL, TSB
// TODO Show graph point attributes: Act name, type, date | Trimp, PSS, SwimSS |
// TODO Show preview days as dashed line
// TODO Filter with power swim
// TODO Filter with power meter
// TODO Support form zones

// TODO Show helper info
// TODO Show info when no data. (Wrap in a parent FitnessTrendComponent (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)

/**
 * date: string; YYYY-MM-DD
 * value: number;
 */
interface GraphPoint {
	date: string;
	value: number;
}

/**
 * label: string;
 */
export interface IPeriodLabeled extends IPeriod {
	label: string;
}

@Component({
	selector: 'app-fitness-trend',
	templateUrl: './fitness-trend-graph.component.html',
	styleUrls: ['./fitness-trend-graph.component.scss']
})
export class FitnessTrendGraphComponent implements OnInit {

	private static readonly GRAPH_CONFIG = {
		data: [],
		full_width: true,
		height: 500,
		right: 40,
		baselines: [{value: 0}],
		transition_on_update: false,
		target: '#fitnessTrendGraph',
		x_accessor: 'date',
		y_accessor: 'value',
		inflator: 1.2,
		// min_y: -50,
		// mouseover: (arg) => {
		// 	console.log("mouseover", arg)
		// },
		// legend: ['Line 1', 'Line 2', 'Line 3'],
		// legend_target: '.legend'
	};

	private static readonly PERIODS: IPeriodLabeled[] = [{
		from: moment().subtract(7, "days").toDate(),
		to: null,
		label: "Last 7 days",
	}, {
		from: moment().subtract(14, "days").toDate(),
		to: null,
		label: "Last 14 days",
	}, {
		from: moment().subtract(1, "months").toDate(),
		to: null,
		label: "Last month",
	}, {
		from: moment().subtract(6, "weeks").toDate(),
		to: null,
		label: "Last 6 weeks",
	}, {
		from: moment().subtract(2, "months").toDate(),
		to: null,
		label: "Last 2 months",
	}, {
		from: moment().subtract(4, "months").toDate(),
		to: null,
		label: "Last 4 months",
	}, {
		from: moment().subtract(6, "months").toDate(),
		to: null,
		label: "Last 6 months",
	}, {
		from: moment().subtract(1, "years").toDate(),
		to: null,
		label: "Last 12 months",
	}, {
		from: moment().subtract(2, "years").toDate(),
		to: null,
		label: "Last 24 months",
	}, {
		from: null,
		to: null,
		label: "From the beginning",
	}];

	private _periods: IPeriod[];
	private _lastPeriodSelected: IPeriod;
	private _fitnessTrend: IDayFitnessTrend[];
	private _fitnessTrendLines: GraphPoint[][] = [];

	private _dateFrom: Date;
	private _dateTo: Date;
	private _dateMin: Date;
	private _dateMax: Date;

	constructor(private _fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		this.periods = FitnessTrendGraphComponent.PERIODS;

		// Set default last period to 4 months
		this.lastPeriodSelected = FitnessTrendGraphComponent.PERIODS[6];

		// Generate graph data
		this.fitnessService.computeTrend(null,
			null,
			null,
			null).then((fitnessTrend: IDayFitnessTrend[]) => {

			this.fitnessTrend = fitnessTrend;

			this.init();

		});
	}

	/**
	 *
	 */
	private init() {

		let fatigueLine: GraphPoint[] = [];
		let fitnessLine: GraphPoint[] = [];
		let formLine: GraphPoint[] = [];

		_.forEach(this.fitnessTrend, (dayFitnessTrend: IDayFitnessTrend) => {

			fatigueLine.push({
				date: dayFitnessTrend.date,
				value: dayFitnessTrend.atl
			});

			fitnessLine.push({
				date: dayFitnessTrend.date,
				value: dayFitnessTrend.ctl
			});

			formLine.push({
				date: dayFitnessTrend.date,
				value: dayFitnessTrend.tsb
			});
		});

		this.fitnessTrendLines.push(MG.convert.date(fatigueLine, 'date'));
		this.fitnessTrendLines.push(MG.convert.date(fitnessLine, 'date'));
		this.fitnessTrendLines.push(MG.convert.date(formLine, 'date'));

		this.updateGraph(this.lastPeriodSelected);
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

		const updatedTrendLines = this.computeTrendLines(period);

		this.applyLines(updatedTrendLines, () => {
			console.debug("Graph update time: " + (performance.now() - _PERFORMANCE_MARKER_START_).toFixed(0) + " ms.")
		});

		// Update dateFrom dateTo fields
		this.dateFrom = (_.isDate(period.from)) ? period.from : null;
		this.dateTo = (_.isDate(period.to)) ? period.to : moment().toDate();
		this._dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this._dateMax = moment().toDate();
	}

	/**
	 *
	 * @param fitnessTrendLines
	 * @param {() => void} done
	 */
	private applyLines(fitnessTrendLines, done: () => void): void {

		const config = FitnessTrendGraphComponent.GRAPH_CONFIG;
		config.data = fitnessTrendLines;

		setTimeout(() => {
			MG.data_graphic(config);
			done();
		});
	}

	/**
	 *
	 * @param {Period} period
	 * @returns {GraphPoint[][]}
	 */
	private computeTrendLines(period: IPeriod): GraphPoint[][] {

		const lines: GraphPoint[][] = [];
		const indexes = this.fitnessService.indexesOf(period, this.fitnessTrend);

		_.forEach(this.fitnessTrendLines, (line: GraphPoint[]) => {
			lines.push(line.slice(indexes.start, indexes.end));
		});

		return lines;
	}


	get periods(): IPeriod[] {
		return this._periods;
	}

	set periods(value: IPeriod[]) {
		this._periods = value;
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

	set fitnessService(value: FitnessService) {
		this._fitnessService = value;
	}

	get fitnessTrend(): IDayFitnessTrend[] {
		return this._fitnessTrend;
	}

	set fitnessTrend(value: IDayFitnessTrend[]) {
		this._fitnessTrend = value;
	}

	get fitnessTrendLines(): GraphPoint[][] {
		return this._fitnessTrendLines;
	}

	set fitnessTrendLines(value: GraphPoint[][]) {
		this._fitnessTrendLines = value;
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
