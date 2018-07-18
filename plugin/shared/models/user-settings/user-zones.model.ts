import { ZoneModel } from "../activity-data/zone.model";

export class UserZonesModel {
	public speed: ZoneModel[];
	public pace: ZoneModel[];
	public gradeAdjustedPace: ZoneModel[];
	public heartRate: ZoneModel[];
	public power: ZoneModel[];
	public runningPower: ZoneModel[];
	public cyclingCadence: ZoneModel[];
	public runningCadence: ZoneModel[];
	public grade: ZoneModel[];
	public elevation: ZoneModel[];
	public ascent: ZoneModel[];
}
