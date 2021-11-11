import { ZoneModel } from "../zone.model";
import _ from "lodash";
import { ZoneType } from "../../enums/zone-type.enum";

export class UserZonesModel {
  public static readonly DEFAULT_MODEL: UserZonesModel = {
    speed: [0, 10, 15, 20, 25, 27, 30, 32, 34, 36, 38, 40, 42, 44, 47, 50, 60, 75],
    pace: [60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 540, 570, 720, 900],
    heartRate: [95, 114, 133, 152, 171, 190, 209],
    power: [0, 50, 100, 150, 175, 200, 225, 250, 300, 325, 350, 375, 400, 425, 450, 475, 500, 600, 800, 1500],
    runningPower: [0, 50, 100, 150, 175, 200, 225, 250, 300, 325, 350, 375, 400, 425, 450, 475, 500, 600, 800, 1500],
    cyclingCadence: [
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 125, 150
    ],
    runningCadence: [
      65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 115, 120
    ],
    grade: [
      -20, -17, -14, -12, -9, -6, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
      20, 25
    ],
    elevation: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000],
    ascent: [
      0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000,
      3200, 3400, 3600, 3800, 4000, 4200, 4400, 4600, 4800, 5000, 6000
    ]
  };

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
    const zoneModels: ZoneModel[] = [];

    _.forEach(zones, (zone: number, index: number) => {
      if (!_.isNumber(zone)) {
        throw new Error(
          "Cannot deserialize zones because of corrupted zones. Try to reset your settings from advanced menu."
        );
      }

      if (_.isNumber(zones[index + 1])) {
        zoneModels.push({
          from: zone,
          to: zones[index + 1]
        });
      }
    });

    return zoneModels;
  }

  public static fromZoneType(userZones: UserZonesModel, zoneType: ZoneType): ZoneModel[] {
    if (userZones[zoneType]) {
      return UserZonesModel.deserialize(userZones[zoneType]);
    }
    return null;
  }

  constructor(
    public speed: number[],
    public pace: number[],
    public heartRate: number[],
    public power: number[],
    public runningPower: number[],
    public cyclingCadence: number[],
    public runningCadence: number[],
    public grade: number[],
    public elevation: number[],
    public ascent: number[]
  ) {}
}
