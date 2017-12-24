import { ProgressType } from "./progress-type.enum";

export class ProgressionModel {

	public onTimestamp: number;
	public onYear: number;
	public onDayOfYear: number;
	public totalDistance: number; // meters
	public totalTime: number; // seconds
	public totalElevation: number; // meters
	public count: number;

	constructor(onTimestamp: number, onYear: number, onDayOfYear: number, totalDistance: number, totalTime: number, totalElevation: number, count: number) {
		this.onTimestamp = onTimestamp;
		this.onYear = onYear;
		this.onDayOfYear = onDayOfYear;
		this.totalDistance = totalDistance;
		this.totalTime = totalTime;
		this.totalElevation = totalElevation;
		this.count = count;
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
