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
		legend_target: '#legend', // FIXME dirty #legend  display: none;   applied
		x_accessor: 'date',
		y_accessor: 'value',
		inflator: 1.2,
		showActivePoint: false,
		clickableMarkerLines: true,
		show_confidence_band: ['lower', 'upper'],
		markers: null,
		legend: null, //['Fatigue', 'Fitness', 'Form'],
		click: function (data: { key: Date, values: any[] }, index: number) {
			console.log(data, index);
		},
		mouseover: (data: { key: Date, values: any[] }, index: number) => {
			this.onMouseOverDate(data.key);
		},
		mouseout: (data, i) => {
			// console.log("out", data);
			this._watchedDay = null;
			// d3.select('#details').html(""); // Clean details
		},
		// min_y: -50,
		/*
		mouseover: (data: { key: Date, values: any[] }, index: number) => {

			// const formattedDate = moment(dayStress.date).format(DayFitnessTrend.DATE_FORMAT);
			const relatedMoment = moment(data.key);

			const relatedDayFitnessTrend: IDayFitnessTrend = _.find(this.fitnessTrend, {
				date: relatedMoment.format(DayFitnessTrend.DATE_FORMAT)
			});

			// TODO Export dedicated function
			const selection = d3.select('svg .mg-active-datapoint');

			const date = relatedMoment.format("MMM Do YYYY");
			let fatigue = data.values[0].value.toFixed(2);
			let fitness = data.values[1].value.toFixed(2);
			let form = data.values[2].value.toFixed(2);

			// TODO Export in template a file
			let legendTemplate = '<tspan x="0" y="0em">';
			legendTemplate += '<tspan>' + date + '</tspan>';
			legendTemplate += '</tspan>';
			legendTemplate += '<tspan x="0" y="1.1em">';
			legendTemplate += '<tspan class="mg-hover-line1-color" fill="">Fatigue</tspan>';
			legendTemplate += '<tspan class="mg-hover-line1-color" fill="">&nbsp;&nbsp;—&nbsp;&nbsp;</tspan>';
			legendTemplate += '<tspan>' + fatigue + '</tspan>';
			legendTemplate += '</tspan>';
			legendTemplate += '<tspan x="0" y="2.2em">';
			legendTemplate += '<tspan class="mg-hover-line2-color" fill="">Fitness</tspan>';
			legendTemplate += '<tspan class="mg-hover-line2-color" fill="">&nbsp;&nbsp;—&nbsp;&nbsp;</tspan>';
			legendTemplate += '<tspan>' + fitness + '</tspan>';
			legendTemplate += '</tspan>';
			legendTemplate += '<tspan x="0" y="3.3em">';
			legendTemplate += '<tspan class="mg-hover-line3-color" fill="">Form</tspan>';
			legendTemplate += '<tspan class="mg-hover-line3-color" fill="">&nbsp;&nbsp;—&nbsp;&nbsp;</tspan>';
			legendTemplate += '<tspan>' + form + '</tspan>';
			legendTemplate += '</tspan>';
			legendTemplate += '<tspan x="0" y="6em">';
			legendTemplate += '<tspan class="mg-hover-line3-color" fill="">Debug</tspan>';
			legendTemplate += '<tspan class="mg-hover-line3-color" fill="">: </tspan>';
			legendTemplate += '<tspan>' + JSON.stringify(relatedDayFitnessTrend.activitiesName) + '</tspan>';
			legendTemplate += '</tspan>';

			selection.html(legendTemplate);
		},
		*/
		// click: function (d, i) {console.log(d, i)}
		// legend: ['Line 1', 'Line 2', 'Line 3'],
		// legend_target: '.legend'
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
		// let activeLine: GraphPoint[] = [];
		/*	activeLine.push({
                        date: dayFitnessTrend.date,
                        value: 0
                    });*/
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
					date: new Date(dayFitnessTrend.timestamp),
					mouseover: () => {
						// console.log(JSON.stringify(dayFitnessTrend));
						this.onMouseOverDate(dayFitnessTrend.date);
					},
					click: () => {
						alert(JSON.stringify(dayFitnessTrend.activitiesName));
					},
					// label: "▾" // Found @ http://www.amp-what.com/
					label: "🠷" // Found @ http://www.amp-what.com/
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

		/*const isActiveDay = this.watchedDay.activitiesName.length > 0;
		if (isActiveDay) {
			// TODO My stuff !
		}*/
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
