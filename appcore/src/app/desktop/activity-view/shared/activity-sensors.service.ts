import { Injectable } from "@angular/core";
import { Sensor } from "./models/sensors/sensor.model";
import { ElevationSensor, ElevationAscentSpeedSensor } from "./models/sensors/elevation.sensor";
import { GradeAdjustedPaceSensor, PaceSensor, SpeedSensor, SwimmingPaceSensor } from "./models/sensors/move.sensor";
import { HeartRateSensor } from "./models/sensors/heart-rate.sensor";
import { CyclingPowerSensor, PowerEstDebugSensor, RunningPowerSensor } from "./models/sensors/power.sensor";
import { CyclingCadenceSensor, RunningCadenceSensor, SwimmingCadenceSensor } from "./models/sensors/cadence.sensor";
import _ from "lodash";
import { GradeSensor } from "./models/sensors/grade.sensor";
import { environment } from "../../../../environments/environment";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

@Injectable()
export class ActivitySensorsService {
  private readonly SPORT_SENSORS_MAP = new Map<ElevateSport, (activity: Activity) => Sensor[]>([
    [ElevateSport.Ride, this.cyclingSensors],
    [ElevateSport.VirtualRide, this.cyclingSensors],
    [ElevateSport.Run, this.byFootSensors],
    [ElevateSport.VirtualRun, this.byFootSensors],
    [ElevateSport.Hike, this.byFootSensors],
    [ElevateSport.Walk, this.byFootSensors],
    [ElevateSport.Swim, this.swimmingSensors]
  ]);

  private defaultSensors(): Sensor[] {
    const sensors = [
      ElevationSensor.DEFAULT,
      ElevationAscentSpeedSensor.DEFAULT,
      SpeedSensor.DEFAULT,
      HeartRateSensor.DEFAULT
    ];
    if (environment.showActivityDebugData) {
      sensors.push(GradeSensor.DEFAULT);
    }
    return sensors;
  }

  private cyclingSensors(activity: Activity): Sensor[] {
    const sensors = [
      ElevationSensor.DEFAULT,
      ElevationAscentSpeedSensor.DEFAULT,
      SpeedSensor.DEFAULT,
      HeartRateSensor.DEFAULT,
      CyclingPowerSensor.getDefault(activity),
      CyclingCadenceSensor.DEFAULT
    ];

    // Adds some streams for debugging purposes (activated in dev only)
    if (environment.showActivityDebugData) {
      sensors.push(PowerEstDebugSensor.getDefault(activity)); // Sensor used to debug the calculated watts against real power w/ "DEBUG_EST_VS_REAL_WATTS" LS key)
      sensors.push(GradeSensor.DEFAULT);
    }

    return sensors;
  }

  private byFootSensors(activity: Activity): Sensor[] {
    const sensors = [
      ElevationSensor.DEFAULT,
      ElevationAscentSpeedSensor.DEFAULT,
      PaceSensor.DEFAULT,
      HeartRateSensor.DEFAULT,
      RunningPowerSensor.getDefault(activity),
      RunningCadenceSensor.DEFAULT,
      GradeSensor.DEFAULT,
      GradeAdjustedPaceSensor.DEFAULT
    ];

    // Adds some streams for debugging purposes (activated in dev only)
    if (environment.showActivityDebugData) {
      sensors.push(PowerEstDebugSensor.getDefault(activity)); // Sensor used to debug the calculated watts against real power w/ "DEBUG_EST_VS_REAL_WATTS" LS key)
      sensors.push(GradeSensor.DEFAULT);
    }

    return sensors;
  }

  private swimmingSensors(): Sensor[] {
    return [SwimmingPaceSensor.DEFAULT, HeartRateSensor.DEFAULT, SwimmingCadenceSensor.DEFAULT];
  }

  public provideSensors(activity: Activity, cherryPickStreams: (keyof Streams)[] = null): Sensor[] {
    // Get function which return sensors per sport type
    const sportSensorsFunction = this.SPORT_SENSORS_MAP.get(activity.type);
    let sensors = sportSensorsFunction ? sportSensorsFunction(activity) : this.defaultSensors();

    // Cherry pick only asked sensor def in given order
    if (cherryPickStreams && cherryPickStreams.length) {
      const cherryPickedSensors = [];
      cherryPickStreams.forEach(streamKey => {
        const cherryPicked = _.find(sensors, { streamKey: streamKey });
        if (cherryPicked) {
          cherryPickedSensors.push(cherryPicked);
        }
      });
      sensors = cherryPickedSensors;
    }

    return sensors;
  }
}
