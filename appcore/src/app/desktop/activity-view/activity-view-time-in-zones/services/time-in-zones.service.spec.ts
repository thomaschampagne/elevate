import { TestBed } from "@angular/core/testing";

import { TimeInZonesService } from "./time-in-zones.service";
import { SharedModule } from "../../../../shared/shared.module";
import { CoreModule } from "../../../../core/core.module";
import { TargetModule } from "../../../../shared/modules/target/desktop-target.module";
import { DataStore } from "../../../../shared/data-store/data-store";
import { TestingDataStore } from "../../../../shared/data-store/testing-datastore.service";
import { ActivityStreamsModel, UserSettings } from "@elevate/shared/models";
import _ from "lodash";
import { UserSettingsService } from "../../../../shared/services/user-settings/user-settings.service";
import { ZoneType } from "@elevate/shared/enums";
import { SensorTimeInZones } from "../models/sensor-time-in-zones.model";
import { Sensor } from "../../shared/models/sensors/sensor.model";
import { HeartRateSensor } from "../../shared/models/sensors/heart-rate.sensor";
import { PaceSensor, SpeedSensor } from "../../shared/models/sensors/move.sensor";
import { CyclingCadenceSensor, RunningCadenceSensor } from "../../shared/models/sensors/cadence.sensor";
import { CyclingPowerSensor, RunningPowerSensor } from "../../shared/models/sensors/power.sensor";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("TimeInZonesService", () => {
  let timeInZonesService: TimeInZonesService;
  let userSettingsService: UserSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [TimeInZonesService, { provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();

    timeInZonesService = TestBed.inject(TimeInZonesService);
    userSettingsService = TestBed.inject(UserSettingsService);
  });

  it("should compute time-in-zones on Ride activity", done => {
    // Given
    const expectedSettings = _.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL);
    spyOn(userSettingsService.userSettingsDao, "findOne").and.returnValue(Promise.resolve(expectedSettings));

    expectedSettings.zones.heartRate = [130, 150, 170, 190];

    const activityStreams = new ActivityStreamsModel();
    activityStreams.time = [0, 5, 10, 15, 20];
    activityStreams.distance = [0, 5, 10, 15, 20];
    activityStreams.heartrate = [130, 145, 161, 162, 175];
    activityStreams.velocity_smooth = [0, 23, 34, 26, 20];
    activityStreams.cadence = [70, 75, 90, 85, 50];
    activityStreams.watts = [170, 175, 190, 185, 150];

    const sensors: Sensor[] = [
      new HeartRateSensor(),
      new SpeedSensor(),
      new CyclingCadenceSensor(),
      new CyclingPowerSensor(true)
    ];

    // When
    const promise: Promise<SensorTimeInZones[]> = timeInZonesService.calculate(sensors, activityStreams);

    // Then
    promise.then(
      sensorTimeInZonesResults => {
        expect(sensorTimeInZonesResults.length).toEqual(4);

        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.RUNNING_CADENCE)
        ).toBeUndefined();
        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.RUNNING_POWER)
        ).toBeUndefined();
        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.SPEED)
        ).not.toBeUndefined();
        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.HEART_RATE)
        ).not.toBeUndefined();
        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.CYCLING_CADENCE)
        ).not.toBeUndefined();
        expect(
          _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.POWER)
        ).not.toBeUndefined();

        const hrZones = _.find(sensorTimeInZonesResults, result => result.sensor.zoneType === ZoneType.HEART_RATE)
          .zones;

        // Zone 130 - 150
        expect(hrZones[0].s).toEqual(5); //
        expect(hrZones[0].percent).toEqual(25);

        // Zone 150 - 170
        expect(hrZones[1].s).toEqual(10);
        expect(hrZones[1].percent).toEqual(50);

        expect(hrZones[2].s).toEqual(5);
        expect(hrZones[2].percent).toEqual(25);

        done();
      },
      error => {
        expect(error).toBeNull();
        throw new Error("Whoops! I should not be here!");
      }
    );
  });

  it("should compute time-in-zones on VirtualRun activity", done => {
    // Given
    const expectedSettings = _.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL);
    spyOn(userSettingsService.userSettingsDao, "findOne").and.returnValue(Promise.resolve(expectedSettings));

    const activityStreams = new ActivityStreamsModel();
    activityStreams.time = [0, 5, 10, 15, 20];
    activityStreams.distance = [0, 5, 10, 15, 20];
    activityStreams.heartrate = [130, 145, 161, 162, 175];
    activityStreams.velocity_smooth = [0, 23, 34, 26, 20];
    activityStreams.cadence = [70, 75, 90, 85, 50];
    activityStreams.watts = [170, 175, 190, 185, 150];

    const sensors: Sensor[] = [
      new HeartRateSensor(),
      new PaceSensor(),
      new RunningCadenceSensor(),
      new RunningPowerSensor(true)
    ];

    // When
    const promise: Promise<SensorTimeInZones[]> = timeInZonesService.calculate(sensors, activityStreams);

    // Then
    promise.then(
      timeInZonesResults => {
        expect(timeInZonesResults.length).toEqual(4);

        expect(
          _.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.CYCLING_CADENCE)
        ).toBeUndefined();
        expect(_.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.POWER)).toBeUndefined();

        expect(_.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.PACE)).not.toBeUndefined();
        expect(
          _.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.HEART_RATE)
        ).not.toBeUndefined();
        expect(
          _.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.RUNNING_CADENCE)
        ).not.toBeUndefined();
        expect(
          _.find(timeInZonesResults, result => result.sensor.zoneType === ZoneType.RUNNING_POWER)
        ).not.toBeUndefined();

        done();
      },
      error => {
        expect(error).toBeNull();
        throw new Error("Whoops! I should not be here!");
      }
    );
  });
});
