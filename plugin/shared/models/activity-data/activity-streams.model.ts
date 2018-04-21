export class ActivityStreamsModel {
	public time: number[];
	public latlng: number[][];
	public heartrate: number[];
	public velocity_smooth: number[];
	public cadence: number[];
	public watts: number[];
	public watts_calc: number[];
	public grade_smooth: number[];
	public distance: number[];
	public altitude: number[];
	public altitude_smooth?: number[];
	public grade_adjusted_distance: Array<number>;
}
