import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { AnalysisDataModel, PeaksData } from "@elevate/shared/models";

export interface PlottableSensor {
  color: string;
  zoneType: ZoneType;
  peaksPath: [keyof AnalysisDataModel, keyof PeaksData];

  fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number | string;
}
