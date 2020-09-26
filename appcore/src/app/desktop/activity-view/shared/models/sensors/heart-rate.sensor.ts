import { Sensor } from "./sensor.model";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { ActivityStreamsModel, AnalysisDataModel, PeaksData } from "@elevate/shared/models";

export class HeartRateSensor extends Sensor {
  public static readonly NAME: string = "Heart Rate";

  public static readonly DEFAULT: HeartRateSensor = new HeartRateSensor();

  public streamKey: keyof ActivityStreamsModel = "heartrate";
  public color = "#ff5f4b";
  public name: string = HeartRateSensor.NAME;
  public defaultRoundDecimals = 0;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "bpm",
    full: "Beats / minute"
  };

  public peaksPath: [keyof AnalysisDataModel, keyof PeaksData] = ["heartRateData", "peaks"];
  public zoneType: ZoneType = ZoneType.HEART_RATE;
}
