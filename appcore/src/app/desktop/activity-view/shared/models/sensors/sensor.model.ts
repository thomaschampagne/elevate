import { BaseSensor } from "./base.sensor";
import { PlottableSensor } from "./interfaces/plottable-sensor.interface";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

export abstract class Sensor extends BaseSensor implements PlottableSensor {
  public abstract streamKey: keyof Streams;

  public abstract peaksPath: [keyof ActivityStats, keyof Peaks];
  public abstract zoneType: ZoneType;
  public abstract color: string;
  public areaColor?: string;

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
