import * as _ from "lodash";

export class ActivityStreamsModel {

	public time: number[];
	public distance: number[];
	public velocity_smooth: number[];
	public altitude: number[];
	public cadence: number[];
	public heartrate: number[];
	public watts: number[];
	public watts_calc: number[];
	public latlng: number[][];
	public grade_smooth: number[];
	public grade_adjusted_speed: number[];
	public altitude_smooth?: number[];

	constructor(time?: number[], distance?: number[], velocity_smooth?: number[], altitude?: number[], cadence?: number[], heartrate?: number[],
				watts?: number[], watts_calc?: number[], latlng?: number[][], grade_smooth?: number[], grade_adjusted_speed?: number[], altitude_smooth?: number[]) {
		this.time = _.isEmpty(time) ? [] : time;
		this.distance = _.isEmpty(distance) ? [] : distance;
		this.velocity_smooth = _.isEmpty(velocity_smooth) ? [] : velocity_smooth;
		this.altitude = _.isEmpty(altitude) ? [] : altitude;
		this.cadence = _.isEmpty(cadence) ? [] : cadence;
		this.heartrate = _.isEmpty(heartrate) ? [] : heartrate;
		this.watts = _.isEmpty(watts) ? [] : watts;
		this.watts_calc = _.isEmpty(watts_calc) ? [] : watts_calc;
		this.latlng = _.isEmpty(latlng) ? [] : latlng;
		this.grade_smooth = _.isEmpty(grade_smooth) ? [] : grade_smooth;
		this.grade_adjusted_speed = _.isEmpty(grade_adjusted_speed) ? [] : grade_adjusted_speed;
		this.altitude_smooth = _.isEmpty(altitude_smooth) ? [] : altitude_smooth;
	}

}
