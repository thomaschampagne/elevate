import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";

export interface PlottableSensor {
  color: string;
  zoneType: ZoneType;
  peaksPath: [keyof ActivityStats, keyof Peaks];

  fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number | string;
}
