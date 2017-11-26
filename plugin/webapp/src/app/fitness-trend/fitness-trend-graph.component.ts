import { Component, OnInit } from '@angular/core';
import { FitnessService, IDayFitnessTrend } from "../services/fitness/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";

// DONE Filter by period until today
// TODO Filter between dates
// TODO Show graph point legend: CTL, ATL, TSB
// TODO Show graph point attributes: Act name, type, date | Trimp, PSS, SwimSS |
// TODO Show preview days as dashed line
// TODO Filter with power swim
// TODO Filter with power meter
// TODO Support form zones
// TODO Forward to strava.com activities
// TODO Show helper info
// TODO Show info when no data. (Wrap in a parent FitnessTrendComponent (w/ child => FitnessTrendGraphComponent & FitnessTrendTableComponent)

interface GraphPoint {
	date: string;
	value: number
}

interface Period {
	days: number;
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
		legend: ['Line 1', 'Line 2', 'Line 3'],
		// legend_target: '.legend'
	};

	private static readonly PERIODS: Period[] = [{
		days: moment.duration(moment().diff(moment().subtract(7, "days"))).asDays(),
		label: "Last 7 days",
	}, {
		days: moment.duration(moment().diff(moment().subtract(14, "days"))).asDays(),
		label: "Last 14 days",
	}, {
		days: moment.duration(moment().diff(moment().subtract(1, "months"))).asDays(),
		label: "Last month",
	}, {
		days: moment.duration(moment().diff(moment().subtract(6, "weeks"))).asDays(),
		label: "Last 6 weeks",
	}, {
		days: moment.duration(moment().diff(moment().subtract(2, "months"))).asDays(),
		label: "Last 2 months",
	}, {
		days: moment.duration(moment().diff(moment().subtract(4, "months"))).asDays(),
		label: "Last 4 months",
	}, {
		days: moment.duration(moment().diff(moment().subtract(6, "months"))).asDays(),
		label: "Last 6 months",
	}, {
		days: moment.duration(moment().diff(moment().subtract(1, "years"))).asDays(),
		label: "Last 12 months",
	}, {
		days: moment.duration(moment().diff(moment().subtract(2, "years"))).asDays(),
		label: "Last 24 months",
	}, {
		days: 0,
		label: "From the beginning",
	}];

	private _periods: Period[] = FitnessTrendGraphComponent.PERIODS;
	private _periodSelected: Period = FitnessTrendGraphComponent.PERIODS[6];
	private _fitnessTrend: IDayFitnessTrend[];
	private _fitnessTrendLines: GraphPoint[][] = [];

	constructor(private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		// Generate graph data
		this.fitnessService.computeTrend(null,
			null,
			null,
			null).then((fitnessTrend: IDayFitnessTrend[]) => {

			this.fitnessTrend = fitnessTrend;

			this.initFirstDraw();
		});
	}

	/**
	 *
	 * @param {IDayFitnessTrend[]} fitnessTrend
	 */
	private initFirstDraw() {

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

		this.updateGraph(this.periodSelected);
	}

	/**
	 *
	 */
	public onPeriodSelected(): void {
		this.updateGraph(this.periodSelected);
	}

	/**
	 *
	 * @param {Period} period
	 */
	private updateGraph(period: Period): void {

		const _performance_marker_start_ = performance.now();

		const updatedTrendLines = this.computeTrendLines(period);

		this.applyLines(updatedTrendLines, () => {
			console.debug("Graph update time: " + (performance.now() - _performance_marker_start_).toFixed(0) + " ms.")
		});
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
	private computeTrendLines(period: Period): GraphPoint[][] {

		const lines: GraphPoint[][] = [];
		_.forEach(this.fitnessTrendLines, (line: GraphPoint[]) => {
			// _.forEach(_.clone(this.fitnessTrendLines), (line: GraphPoint[]) => {
			lines.push(line.slice(period.days * -1));
		});

		return lines;
	}

	get periods(): Period[] {
		return this._periods;
	}

	set periods(value: Period[]) {
		this._periods = value;
	}

	get periodSelected(): Period {
		return this._periodSelected;
	}

	set periodSelected(value: Period) {
		this._periodSelected = value;
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
}
