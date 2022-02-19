import { Sensor } from "../../shared/models/sensors/sensor.model";
import { ZoneModel } from "@elevate/shared/models/zone.model";

export interface SensorTimeInZones {
  sensor: Sensor;
  zones: ZoneModel[];
}
