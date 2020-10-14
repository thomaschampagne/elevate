import _ from "lodash";
import {
  ActivitySourceDataModel,
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  UserSettings
} from "@elevate/shared/models";
import { ElevateSport } from "@elevate/shared/enums";
import { ActivityComputer, RunningPowerEstimator } from "@elevate/shared/sync";

import streamJson_852961332 from "../fixtures/852961332/stream.json";
import streamJson_878683797 from "../fixtures/878683797/stream.json";
import streamJson_833008371 from "../fixtures/833008371/stream.json";
import streamJson_874762067 from "../fixtures/874762067/stream.json";
import streamJson_887284960 from "../fixtures/887284960/stream.json";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("RunningPowerEstimator", () => {
  function HHMMSStoSeconds(str: string): number {
    let p: string[] = str.split(":"),
      s: any = 0,
      m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }
    return s;
  }

  const WATTS_TOLERANCE = 35.5; // W

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/874762067)",
    () => {
      // Given
      const weightKg = 54.32; // Kg
      const meters = 6.9 * 1000; // 6.9 km
      const totalSeconds = HHMMSStoSeconds("00:39:48");
      const elevationGain = 25;
      const expectedAvgPower = 151;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);

      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/852961332)",
    () => {
      // Given
      const weightKg = 79.4; // Kg
      const meters = 12.8 * 1000;
      const totalSeconds = HHMMSStoSeconds("01:02:25");
      const elevationGain = 0;
      const expectedAvgPower = 287;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);

      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/878683797)",
    () => {
      // Given
      const weightKg = 79.4; // Kg
      const meters = 15.7 * 1000;
      const totalSeconds = HHMMSStoSeconds("01:14:52");
      const elevationGain = 148;
      const expectedAvgPower = 296;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);

      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/849522984)",
    () => {
      // Given
      const weightKg = 68.94; // Kg
      const meters = 5.3 * 1000;
      const totalSeconds = HHMMSStoSeconds("00:30:22");
      const elevationGain = 64;
      const expectedAvgPower = 214;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);

      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/862889505)",
    () => {
      // Given
      const weightKg = 68.94; // Kg
      const meters = 7.5 * 1000;
      const totalSeconds = HHMMSStoSeconds("00:44:23");
      const elevationGain = 56;

      const expectedAvgPower = 215;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);
      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it(
    "estimateRunningPower should provide a consistency average power compared to " +
      "real running power meter (based on https://www.strava.com/activities/791460353)",
    () => {
      // Given
      const weightKg = 81.61; // Kg
      const meters = 8.8 * 1000;
      const totalSeconds = HHMMSStoSeconds("00:41:14");
      const elevationGain = 32;

      const expectedAvgPower = 285;

      // When
      const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);
      // Then
      expect(power).toBeGreaterThanOrEqual(expectedAvgPower - WATTS_TOLERANCE);
      expect(power).toBeLessThanOrEqual(expectedAvgPower + WATTS_TOLERANCE);
    }
  );

  it("estimateRunningPower should provide return zero power when totalSeconds = 0", () => {
    // Given
    const weightKg = 54.32; // Kg
    const meters = 6.9 * 1000; // 6.9 km
    const totalSeconds = 0;
    const elevationGain = 25;
    const expectedAvgPower = 0;

    // When
    const power = RunningPowerEstimator.estimateRunningPower(weightKg, meters, totalSeconds, elevationGain);

    // Then
    expect(power).toEqual(expectedAvgPower);
  });

  it(
    "createRunningPowerEstimationStream should provide " +
      "power stats estimations near real running power meter  (based on https://www.strava.com/activities/874762067)",
    () => {
      // Given
      const expectedPower = 151; // Real Running Average Power = 151 W (From power meter)
      const athleteWeight = 54.32;
      const stream: ActivityStreamsModel = _.cloneDeep(streamJson_874762067 as unknown) as ActivityStreamsModel; // Mikala run sample 1/2 NCNR Run Club

      // When
      const powerArray: number[] = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        stream.distance,
        stream.time,
        stream.altitude
      );
      const estimatedAvgPower: number = _.mean(powerArray);

      // Then
      expect(estimatedAvgPower).not.toBeNull();
      expect(estimatedAvgPower).toBeGreaterThanOrEqual(expectedPower - WATTS_TOLERANCE);
      expect(estimatedAvgPower).toBeLessThanOrEqual(expectedPower + WATTS_TOLERANCE);
    }
  );

  it(
    "createRunningPowerEstimationStream should provide " +
      "power stats estimations near real running power meter  (based on https://www.strava.com/activities/852961332)",
    () => {
      // Given
      const expectedPower = 287;
      const athleteWeight = 79.4;
      const stream: ActivityStreamsModel = _.cloneDeep(streamJson_852961332 as unknown) as ActivityStreamsModel; // Stryd 3/6 lap test .... brrr

      // When
      const powerArray: number[] = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        stream.distance,
        stream.time,
        stream.altitude
      );

      const estimatedAvgPower: number = _.mean(powerArray);

      // Then
      expect(estimatedAvgPower).not.toBeNull();
      expect(estimatedAvgPower).toBeGreaterThanOrEqual(expectedPower - WATTS_TOLERANCE);
      expect(estimatedAvgPower).toBeLessThanOrEqual(expectedPower + WATTS_TOLERANCE);
    }
  );

  it(
    "createRunningPowerEstimationStream should provide " +
      "power stats estimations near real running power meter" +
      "based on https://www.strava.com/activities/878683797",
    () => {
      // Given
      const expectedPower = 296;
      const athleteWeight = 79.4;

      // Two shooting ranges and a road dedicated to the inventor of Velcro
      const stream: ActivityStreamsModel = _.cloneDeep(streamJson_878683797 as unknown) as ActivityStreamsModel;

      // When
      const powerArray: number[] = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        stream.distance,
        stream.time,
        stream.altitude
      );

      const estimatedAvgPower: number = _.mean(powerArray);

      // Then
      expect(estimatedAvgPower).not.toBeNull();
      expect(estimatedAvgPower).toBeGreaterThanOrEqual(expectedPower - WATTS_TOLERANCE);
      expect(estimatedAvgPower).toBeLessThanOrEqual(expectedPower + WATTS_TOLERANCE);
    }
  );

  it(
    "createRunningPowerEstimationStream should provide " +
      "power stats estimations near real running power meter" +
      "based on https://www.strava.com/activities/833008371",
    () => {
      // Given
      const expectedPower = 310;
      const athleteWeight = 79.4;

      const stream: ActivityStreamsModel = _.cloneDeep(streamJson_833008371 as unknown) as ActivityStreamsModel; // Morning Run

      // When
      const powerArray: number[] = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        stream.distance,
        stream.time,
        stream.altitude
      );

      const estimatedAvgPower: number = _.mean(powerArray);

      // Then
      expect(estimatedAvgPower).not.toBeNull();
      expect(estimatedAvgPower).toBeGreaterThanOrEqual(expectedPower - WATTS_TOLERANCE);
      expect(estimatedAvgPower).toBeLessThanOrEqual(expectedPower + WATTS_TOLERANCE);
    }
  );

  // Running power testN
  it(
    "should compute correctly 'Begin Running Ep 1 // Stade 40min' " + "@ https://www.strava.com/activities/887284960",
    done => {
      // Given
      const activityType = ElevateSport.Run;
      const isTrainer = false;
      const isOwner = true;
      const hasPowerMeter = false;
      const bounds: number[] = null;
      const returnZones = true;
      const returnPowerCurve = true;
      const userSettingsMock: UserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
      const stream: ActivityStreamsModel = _.cloneDeep(streamJson_887284960 as unknown) as ActivityStreamsModel;
      const activitySourceData: ActivitySourceDataModel = {
        movingTime: -1,
        elevation: -1,
        distance: -1
      };
      const athleteSnapshot = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9)
      );

      // When
      const activityComputer: ActivityComputer = new ActivityComputer(
        activityType,
        isTrainer,
        userSettingsMock,
        athleteSnapshot,
        isOwner,
        hasPowerMeter,
        stream,
        bounds,
        returnZones,
        returnPowerCurve,
        activitySourceData
      );

      const result: AnalysisDataModel = activityComputer.compute();

      // Then
      expect(result.powerData).not.toBeNull();
      done();
    }
  );
});
