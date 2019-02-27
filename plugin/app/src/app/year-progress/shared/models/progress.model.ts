import { ProgressType } from "../enums/progress-type.enum";

export class ProgressModel {

	public year: number;
	public dayOfYear: number;
	public distance: number; // meters
	public time: number; // seconds
	public elevation: number; // meters
	public count: number;
	public isFuture: boolean;

	constructor(year: number, dayOfYear: number, distance: number, time: number,
				elevation: number, count: number, isFuture?: boolean) {
		this.year = year;
		this.dayOfYear = dayOfYear;
		this.distance = distance;
		this.time = time;
		this.elevation = elevation;
		this.count = count;
		this.isFuture = (isFuture === true) ? isFuture : false;
	}

	public valueOf(type: ProgressType): number {

		switch (type) {
			case ProgressType.DISTANCE:
				return this.distance;

			case ProgressType.TIME:
				return this.time;

			case ProgressType.ELEVATION:
				return this.elevation;

			case ProgressType.COUNT:
				return this.count;

			default:
				throw new Error("Unknown progress type: " + type);

		}
	}
}
