import { Inject, Injectable } from "@angular/core";
import { UserSettingsService } from "../../../../shared/services/user-settings/user-settings.service";
import { ActivityStreamsModel, UserZonesModel, ZoneModel } from "@elevate/shared/models";
import _ from "lodash";
import { SensorTimeInZones } from "../models/sensor-time-in-zones.model";
import { Sensor } from "../../shared/models/sensors/sensor.model";
import { MeasureSystem } from "@elevate/shared/enums";

@Injectable()
export class TimeInZonesService {
  constructor(@Inject(UserSettingsService) private readonly userSettingsService: UserSettingsService) {}

  public calculate(sensors: Sensor[], activityStreams: ActivityStreamsModel): Promise<SensorTimeInZones[]> {
    return this.userSettingsService.fetch().then(userSettings => {
      // Detect available sensors first
      const availableSensorZones: SensorTimeInZones[] = [];

      for (const sensor of sensors) {
        // Check if zone type exists with associated stream
        if (sensor.zoneType && activityStreams[sensor.streamKey] && activityStreams[sensor.streamKey].length > 0) {
          // If stream exists, find and store the associated user zones settings
          // Init time in zone to 0 seconds
          const userZones = UserZonesModel.fromZoneType(userSettings.zones, sensor.zoneType).map((zone: ZoneModel) => {
            zone.s = 0;
            return zone;
          });

          availableSensorZones.push({ sensor: sensor, zones: userZones });
        }
      }

      // Loop over time
      for (const [index, current] of activityStreams.time.entries()) {
        if (index === 0) {
          continue;
        }

        const duration = current - activityStreams.time[index - 1];

        for (const sensorZones of availableSensorZones) {
          // Access stream
          const curStream = activityStreams[sensorZones.sensor.streamKey] as number[];

          // Get the value in current stream
          const value = curStream[index];

          // Detect zone of value. We force convert sensor value using metric system (zones settings are stored with metric system)
          const convertedValue = sensorZones.sensor.fromStreamConvert(value, MeasureSystem.METRIC);
          const userZoneToUpdate = this.getZoneOfValue(sensorZones, convertedValue, MeasureSystem.METRIC);

          // Append time in zone if exists
          if (userZoneToUpdate) {
            userZoneToUpdate.s += duration;
          }
        }
      }

      const timeInZonesResults: SensorTimeInZones[] = [];

      // Compute percentage distribution
      const totalSec = _.last(activityStreams.time);

      for (const sensorZones of availableSensorZones) {
        const userZones = sensorZones.zones;

        userZones.forEach(zone => {
          zone.percent = _.round((zone.s / totalSec) * 100, 2);
        });

        timeInZonesResults.push(sensorZones);
      }

      return Promise.resolve(timeInZonesResults);
    });
  }

  private getZoneOfValue(sensorZones: SensorTimeInZones, value: number, measureSystem: MeasureSystem): ZoneModel {
    let matchingZone = null;

    for (const zone of sensorZones.zones) {
      if (value <= sensorZones.sensor.fromZoneBoundConvert(zone.to, measureSystem)) {
        matchingZone = zone;
        break;
      }
    }

    return matchingZone;
  }
}
