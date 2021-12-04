import { Sensor } from "./sensor.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

export class GradeSensor extends Sensor {
  public static readonly NAME: string = "Grade";

  public static readonly DEFAULT: GradeSensor = new GradeSensor();

  public streamKey: keyof Streams = "grade_smooth";
  public color = "#00efd3";
  public areaColor = "#00efd338";
  public name: string = GradeSensor.NAME;
  public defaultRoundDecimals = 1;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "%",
    full: "Percentage"
  };

  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["grade", "peaks"];
  public zoneType: ZoneType = ZoneType.GRADE;
}
