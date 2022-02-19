import { Sensor } from "./sensor.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

export class HeartRateSensor extends Sensor {
  public static readonly NAME: string = "Heart Rate";

  public static readonly DEFAULT: HeartRateSensor = new HeartRateSensor();

  public streamKey: keyof Streams = "heartrate";
  public color = "#ff5f4b";
  public areaColor = "#ff5f4b38";
  public name: string = HeartRateSensor.NAME;
  public defaultRoundDecimals = 0;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "bpm",
    full: "Beats / minute"
  };

  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["heartRate", "peaks"];
  public zoneType: ZoneType = ZoneType.HEART_RATE;
}
