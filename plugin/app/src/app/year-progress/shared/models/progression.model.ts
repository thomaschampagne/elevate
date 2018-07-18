import { ProgressType } from "./progress-type.enum";

export class ProgressionModel {

	public year: number;
	public dayOfYear: number;
	public totalDistance: number; // meters
	public totalTime: number; // seconds
	public totalElevation: number; // meters
	public count: number;
	public isFuture: boolean;

	constructor(year: number, dayOfYear: number, totalDistance: number, totalTime: number,
				totalElevation: number, count: number, isFuture?: boolean) {
		this.year = year;
		this.dayOfYear = dayOfYear;
		this.totalDistance = totalDistance;
		this.totalTime = totalTime;
		this.totalElevation = totalElevation;
		this.count = count;
		this.isFuture = (isFuture === true) ? isFuture : false;
	}

	public valueOf(type: ProgressType): number {

		switch (type) {
			case ProgressType.DISTANCE:
				return this.totalDistance;

			case ProgressType.TIME:
				return this.totalTime;

			case ProgressType.ELEVATION:
				return this.totalElevation;

			case ProgressType.COUNT:
				return this.count;

			default:
				throw new Error("Unknown progress type: " + type);

		}
	}
}
