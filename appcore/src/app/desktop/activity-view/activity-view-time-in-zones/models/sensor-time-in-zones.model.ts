import { ZoneModel } from "@elevate/shared/models";
import { Sensor } from "../../shared/models/sensors/sensor.model";

export interface SensorTimeInZones {
  sensor: Sensor;
  zones: ZoneModel[];
}
