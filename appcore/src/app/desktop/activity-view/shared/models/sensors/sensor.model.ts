import { ActivityStreamsModel, AnalysisDataModel, PeaksData } from "@elevate/shared/models";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { BaseSensor } from "./base.sensor";
import { PlottableSensor } from "./interfaces/plottable-sensor.interface";

export abstract class Sensor extends BaseSensor implements PlottableSensor {
  public abstract streamKey: keyof ActivityStreamsModel;

  public abstract peaksPath: [keyof AnalysisDataModel, keyof PeaksData];
  public abstract zoneType: ZoneType;
  public abstract color: string;

  public fromStreamConvert(streamValue: number, measureSystem: MeasureSystem, lastConvertedValue?: number): number {
    return streamValue;
  }

  public fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number {
    return zoneBoundValue;
  }

  public displayZoneBoundValue(zoneBoundValue: number): number | string {
    return zoneBoundValue;
  }
}
