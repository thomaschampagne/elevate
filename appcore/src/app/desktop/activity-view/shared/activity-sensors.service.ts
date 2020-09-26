import { Injectable } from "@angular/core";
import { ElevateSport } from "@elevate/shared/enums";
import { ActivityStreamsModel, SyncedActivityModel } from "@elevate/shared/models";
import { Sensor } from "./models/sensors/sensor.model";
import { ElevationSensor } from "./models/sensors/elevation.sensor";
import { PaceSensor, SpeedSensor, SwimmingPaceSensor } from "./models/sensors/move.sensor";
import { HeartRateSensor } from "./models/sensors/heart-rate.sensor";
import { CyclingPowerSensor, RunningPowerSensor } from "./models/sensors/power.sensor";
import { CyclingCadenceSensor, RunningCadenceSensor, SwimmingCadenceSensor } from "./models/sensors/cadence.sensor";
import _ from "lodash";

@Injectable()
export class ActivitySensorsService {
  private readonly SPORT_SENSORS_MAP = new Map<ElevateSport, (activity: SyncedActivityModel) => Sensor[]>([
    [ElevateSport.Ride, this.cyclingSensors],
    [ElevateSport.VirtualRide, this.cyclingSensors],
    [ElevateSport.Run, this.runningSensors],
    [ElevateSport.VirtualRun, this.runningSensors],
    [ElevateSport.Swim, this.swimmingSensors]
  ]);

  private defaultSensors(): Sensor[] {
    return [ElevationSensor.DEFAULT, SpeedSensor.DEFAULT, HeartRateSensor.DEFAULT];
  }

  private cyclingSensors(activity: SyncedActivityModel): Sensor[] {
    return [
      ElevationSensor.DEFAULT,
      SpeedSensor.DEFAULT,
      HeartRateSensor.DEFAULT,
      CyclingPowerSensor.getDefault(activity),
      CyclingCadenceSensor.DEFAULT
    ];
  }

  private runningSensors(activity: SyncedActivityModel): Sensor[] {
    return [
      ElevationSensor.DEFAULT,
      PaceSensor.DEFAULT,
      HeartRateSensor.DEFAULT,
      RunningPowerSensor.getDefault(activity),
      RunningCadenceSensor.DEFAULT
    ];
  }

  private swimmingSensors(): Sensor[] {
    return [SwimmingPaceSensor.DEFAULT, HeartRateSensor.DEFAULT, SwimmingCadenceSensor.DEFAULT];
  }

  public provideSensors(
    activity: SyncedActivityModel,
    cherryPickStreams: (keyof ActivityStreamsModel)[] = null
  ): Sensor[] {
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
