import { ZoneModel } from "../zone.model";
import * as _ from "lodash";

export class UserZonesModel {

	public static readonly TYPE_SPEED: string = "speed";
	public static readonly TYPE_PACE: string = "pace";
	public static readonly TYPE_GRADEADJUSTEDPACE: string = "gradeAdjustedPace";
	public static readonly TYPE_HEARTRATE: string = "heartRate";
	public static readonly TYPE_POWER: string = "power";
	public static readonly TYPE_RUNNINGPOWER: string = "runningPower";
	public static readonly TYPE_CYCLINGCADENCE: string = "cyclingCadence";
	public static readonly TYPE_RUNNINGCADENCE: string = "runningCadence";
	public static readonly TYPE_GRADE: string = "grade";
	public static readonly TYPE_ELEVATION: string = "elevation";
	public static readonly TYPE_ASCENT: string = "ascent";


	public static asInstance(userZonesModel: UserZonesModel): UserZonesModel {
		return new UserZonesModel(
			userZonesModel.speed,
			userZonesModel.pace,
			userZonesModel.gradeAdjustedPace,
			userZonesModel.heartRate,
			userZonesModel.power,
			userZonesModel.runningPower,
			userZonesModel.cyclingCadence,
			userZonesModel.runningCadence,
			userZonesModel.grade,
			userZonesModel.elevation,
			userZonesModel.ascent,
		);
	}

	public static serialize(zoneModels: ZoneModel[]): number[] {

		const serialized: number[] = [];

		_.forEach(zoneModels, (zoneModel: ZoneModel, index: number) => {

			if (!zoneModel.from && !zoneModel.to) {
				throw new Error("Cannot serialize zoneModels");
			}

			if (zoneModels[index - 1]) {

				if (zoneModels[index - 1].to !== zoneModel.from) {
					serialized.push(zoneModel.from);
				}

				serialized.push(zoneModel.to);

			} else {
				serialized.push(zoneModel.from);
				serialized.push(zoneModel.to);
			}

		});

		return serialized;
	}

	public static deserialize(zones: number[]): ZoneModel[] {

		const deserialized: ZoneModel[] = [];

		_.forEach(zones, (zone: number, index: number) => {

			if (!_.isNumber(zone)) {
				throw new Error("Cannot deserialize zones");
			}


			if (_.isNumber(zones[index + 1])) {
				deserialized.push({
					from: zone,
					to: zones[index + 1]
				});

			}
		});

		return deserialized;
	}

	constructor(public speed: number[],
				public pace: number[],
				public gradeAdjustedPace: number[],
				public heartRate: number[],
				public power: number[],
				public runningPower: number[],
				public cyclingCadence: number[],
				public runningCadence: number[],
				public grade: number[],
				public elevation: number[],
				public ascent: number[]) {

	}

	public get?(type: string): ZoneModel[] {
		const zones = _.propertyOf(this)(type);
		if (!zones) {
			throw new Error("Cannot retrieve zones for type: " + type);
		}
		return UserZonesModel.deserialize(zones);
	}
}
