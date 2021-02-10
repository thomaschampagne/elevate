import { Sensor } from "./sensor.model";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { AnalysisDataModel, PeaksData, Streams } from "@elevate/shared/models";

export class GradeSensor extends Sensor {
  public static readonly NAME: string = "Grade";

  public static readonly DEFAULT: GradeSensor = new GradeSensor();

  public streamKey: keyof Streams = "grade_smooth";
  public color = "#00efd3";
  public name: string = GradeSensor.NAME;
  public defaultRoundDecimals = 1;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "%",
    full: "Percentage"
  };

  public peaksPath: [keyof AnalysisDataModel, keyof PeaksData] = ["gradeData", "peaks"];
  public zoneType: ZoneType = ZoneType.GRADE;
}
