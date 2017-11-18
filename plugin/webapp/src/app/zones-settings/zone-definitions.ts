export interface IZoneDefinition {
	name: string;
	value: string;
	units: string;
	step: number;
	min: number;
	max: number;
	hasConversion?: boolean;
}

export const ZONE_DEFINITIONS: IZoneDefinition[] = [
	{
		name: "Cycling Speed",
		value: "speed",
		units: "KPH",
		step: 0.1,
		min: 0,
		max: 9999,
		hasConversion: true,
	}, {
		name: "Running Pace",
		value: "pace",
		units: "Seconds", // s/mi?!
		step: 1,
		min: 0,
		max: 9999,
		hasConversion: true,
	}, {
		name: "Heart Rate",
		value: "heartRate",
		units: "BPM",
		step: 1,
		min: 0,
		max: 9999,
	}, {
		name: "Cycling Power",
		value: "power",
		units: "Watts",
		step: 1,
		min: 0,
		max: 9999,
	}, {
		name: "Running Power",
		value: "runningPower",
		units: "Watts",
		step: 1,
		min: 0,
		max: 9999,
	}, {
		name: "Cycling Cadence",
		value: "cyclingCadence",
		units: "RPM",
		step: 1,
		min: 0,
		max: 9999,
	}, {
		name: "Running Cadence",
		value: "runningCadence",
		units: "SPM",
		step: 0.1,
		min: 0,
		max: 9999,
	}, {
		name: "Grade",
		value: "grade",
		units: "%",
		step: 0.1,
		min: -9999,
		max: 9999,
	}, {
		name: "Elevation",
		value: "elevation",
		units: "m",
		step: 5,
		min: 0,
		max: 9999,
	}, {
		name: "Ascent speed",
		value: "ascent",
		units: "Vm/h",
		step: 5,
		min: 0,
		max: 9999,
	}
];
