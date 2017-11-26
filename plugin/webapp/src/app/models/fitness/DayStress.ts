export class DayStress {

	private _ids: number[];
	private _date: Date;
	private _timestamp: number;
	private _type: string[];
	private _activitiesName: string[];
	private _trimpScore?: number;
	private _powerStressScore?: number;
	private _swimStressScore?: number;
	private _finalStressScore: number;
	private _previewDay: boolean;

	constructor(date: Date, previewDay: boolean) {
		this._ids = [];
		this._date = date;
		this._timestamp = date.getTime();
		this._type = [];
		this._activitiesName = [];
		this._trimpScore = null;
		this._powerStressScore = null;
		this._swimStressScore = null;
		this._finalStressScore = null;
		this._previewDay = previewDay;
	}

	get ids(): number[] {
		return this._ids;
	}

	set ids(value: number[]) {
		this._ids = value;
	}

	get date(): Date {
		return this._date;
	}

	set date(value: Date) {
		this._date = value;
	}

	get timestamp(): number {
		return this._timestamp;
	}

	set timestamp(value: number) {
		this._timestamp = value;
	}

	get type(): string[] {
		return this._type;
	}

	set type(value: string[]) {
		this._type = value;
	}

	get activitiesName(): string[] {
		return this._activitiesName;
	}

	set activitiesName(value: string[]) {
		this._activitiesName = value;
	}

	get trimpScore(): number {
		return this._trimpScore;
	}

	set trimpScore(value: number) {
		this._trimpScore = value;
	}

	get powerStressScore(): number {
		return this._powerStressScore;
	}

	set powerStressScore(value: number) {
		this._powerStressScore = value;
	}

	get swimStressScore(): number {
		return this._swimStressScore;
	}

	set swimStressScore(value: number) {
		this._swimStressScore = value;
	}

	get finalStressScore(): number {
		return this._finalStressScore;
	}

	set finalStressScore(value: number) {
		this._finalStressScore = value;
	}

	get previewDay(): boolean {
		return this._previewDay;
	}

	set previewDay(value: boolean) {
		this._previewDay = value;
	}
}
