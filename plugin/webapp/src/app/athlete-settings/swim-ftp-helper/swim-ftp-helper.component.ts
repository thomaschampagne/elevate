import * as moment from "moment";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from "lodash";

interface ISwimCalculationMethod {
	active: boolean;
	name: string;
	params: IFormulaParams[];
	formula: (params: IFormulaParams[]) => number;
}

interface IFormulaParams {
	hint: string,
	value: number
}

@Component({
	selector: 'app-swim-ftp-helper',
	templateUrl: './swim-ftp-helper.component.html',
	styleUrls: ['./swim-ftp-helper.component.scss']
})
export class SwimFtpHelperComponent implements OnInit {

	public static convertMPerMinToTimePer100m(swimFTP: number): string {
		// FIXME Error when swimFTP under 0.8 m/min
		return (!swimFTP || swimFTP <= 0) ? "" : moment(((1 / swimFTP) * 60 * 100) * 1000).format("mm:ss");
	}

	@Input("swimFtp")
	private _swimFtp: number;

	@Output("swimFtpChange")
	private _swimFtpChange = new EventEmitter<number>();

	private _calculationMethods: ISwimCalculationMethod[] = [{
		active: false,
		name: "60 minutes swimming FTP test (recommended)",
		params: [{
			hint: "Swim as far as possible during 60 minutes and enter distance performed in meters (ex: 1800 meters)",
			value: null,
		}],
		formula: (params: IFormulaParams[]) => {
			return params[0].value / 60;
		},
	}, {
		active: false,
		name: "30 minutes swimming FTP test",
		params: [{
			hint: "Swim as far as possible during 30 minutes and enter distance performed in meters (ex: 950 meters)",
			value: null,
		}],
		formula: (params: IFormulaParams[]) => {
			return (params[0].value / 30) - ((2 * params[0].value / 30 ) * 0.025); // (distance(m) / 30) - ( (2 * distance(m) / 30 ) * 0.025)
		},
	}, {
		active: false,
		name: "Critical velocity test session: (1) 200m swim test. (2) Rest. (3) 400m swim test",
		params: [{
			hint: "Swim as fast as possible on 200 meters. Enter time performed in seconds (ex: 210 seconds)",
			value: null,
		}, {
			hint: "After a rest (same session), swim as fast as possible on 400 meters. Enter time performed in seconds (ex: 590 seconds)",
			value: null,
		}],
		formula: (params: IFormulaParams[]) => {
			return ((400 - 200) / ((params[1].value - params[0].value) / 60)); // (400m – 200m) / (400mTimeInMinutes - 200mTimeInMinutes)
		},
	}];


	constructor() {
	}

	public ngOnInit() {

	}

	public onMethodChanged(selectedMethod: ISwimCalculationMethod): void {

		// alert(selectedMethod.active)

		if(selectedMethod.active) {

			// Make all other method inactive
			const othersMethods = _.reject(this._calculationMethods, (method: any) => {
				return method.name === selectedMethod.name;
			});

			_.forEach(othersMethods, (method: any) => {
				method.active = false;
			});

			const swimFtp = selectedMethod.formula(selectedMethod.params);

			if (_.isFinite(swimFtp) && _.isNumber(swimFtp) && swimFtp > 0) {

				this._swimFtp = (_.isNumber(swimFtp) && swimFtp >= 0) ? parseFloat(swimFtp.toFixed(3)) : null;

			} else {

				this._swimFtp = null;

			}

			this._swimFtpChange.emit(this._swimFtp);

		}


	}


	get calculationMethods(): ISwimCalculationMethod[] {
		return this._calculationMethods;
	}

	set calculationMethods(value: ISwimCalculationMethod[]) {
		this._calculationMethods = value;
	}

	get swimFtp(): number {
		return this._swimFtp;
	}

	set swimFtp(value: number) {
		this._swimFtp = value;
	}

	get swimFtpChange(): EventEmitter<number> {
		return this._swimFtpChange;
	}

	set swimFtpChange(value: EventEmitter<number>) {
		this._swimFtpChange = value;
	}
}
