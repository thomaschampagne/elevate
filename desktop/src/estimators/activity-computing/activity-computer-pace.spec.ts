import {
  ActivitySourceDataModel,
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  UserSettings,
} from "@elevate/shared/models";
import * as _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";
import { ActivityComputer } from "@elevate/shared/sync";

import * as streamJson_887284960 from "../fixtures/887284960/stream.json";
import * as streamJson_878683797 from "../fixtures/878683797/stream.json";
import * as streamJson_849522984 from "../fixtures/849522984/stream.json";
import * as streamJson_708752345 from "../fixtures/708752345/stream.json";
import * as streamJson_1550722452 from "../fixtures/1550722452/stream.json";
import * as streamJson_350379527 from "../fixtures/350379527/stream.json";
import * as streamJson_1551720271 from "../fixtures/1551720271/stream.json";
import * as streamJson_1553538436 from "../fixtures/1553538436/stream.json";
import * as streamJson_1553976435 from "../fixtures/1553976435/stream.json";
import * as streamJson_1553069082 from "../fixtures/1553069082/stream.json";
import * as streamJson_1654295114 from "../fixtures/1654295114/stream.json";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

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

function secondsToHHMMSS(secondsParam: number, trimLeadingZeros?: boolean): string {
  const secNum: number = Math.round(secondsParam); // don't forget the second param
  const hours: number = Math.floor(secNum / 3600);
  const minutes: number = Math.floor((secNum - hours * 3600) / 60);
  const seconds: number = secNum - hours * 3600 - minutes * 60;

  let time: string = hours < 10 ? "0" + hours.toFixed(0) : hours.toFixed(0);
  time += ":" + (minutes < 10 ? "0" + minutes.toFixed(0) : minutes.toFixed(0));
  time += ":" + (seconds < 10 ? "0" + seconds.toFixed(0) : seconds.toFixed(0));

  return trimLeadingZeros ? trimLeadingZerosHHMMSS(time) : time;
}

function trimLeadingZerosHHMMSS(time: string): string {
  const result: string = time.replace(/^(0*:)*/, "").replace(/^0*/, "") || "0";
  if (result.indexOf(":") < 0) {
    return result + "s";
  }
  return result;
}

const expectPace = (expectPaceString: string, toEqualPaceString: string, secondsTolerance: number) => {
  const expectedPace: number = HHMMSStoSeconds(expectPaceString);
  const toEqualPace: number = HHMMSStoSeconds(toEqualPaceString);
  const lowerOkPace: number = toEqualPace - secondsTolerance;
  const higherOkPace: number = toEqualPace + secondsTolerance;
  const isBetween = lowerOkPace <= expectedPace && expectedPace <= higherOkPace;

  if (!isBetween) {
    console.error(
      "Expected pace '" +
        expectPaceString +
        "' not between min pace: '" +
        secondsToHHMMSS(lowerOkPace) +
        "' and max pace: '" +
        secondsToHHMMSS(higherOkPace) +
        "'.\r\n=> Lower: " +
        lowerOkPace +
        " <= expected: " +
        expectedPace +
        " <= higher: " +
        higherOkPace
    );
  }

  expect(isBetween).toBeTruthy();
};

describe("ActivityComputer Paces", () => {
  const activityType = ElevateSport.Run;
  const isTrainer = false;
  const isOwner = true;
  const hasPowerMeter = false;
  const bounds: number[] = null;
  const returnZones = false;
  const returnPowerCurve = true;
  const userSettingsMock: UserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
  const athleteSnapshot = new AthleteSnapshotModel(
    Gender.MEN,
    new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9)
  );
  const activitySourceData: ActivitySourceDataModel = {
    movingTime: -1,
    elevation: -1,
    distance: -1,
  };

  const PACE_SECONDS_TOLERANCE = 10;

  it("should compute grade adjusted pace of activity 887284960", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_887284960 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:06:11", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 878683797", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_878683797 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:04:43", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 849522984", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_849522984 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:05:36", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 708752345", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_708752345 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:06:54", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1550722452", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1550722452 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:04:29", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 350379527", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_350379527 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:06:57", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1551720271", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1551720271 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:04:59", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1553538436", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1553538436 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:04:02", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1553976435", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1553976435 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:06:05", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1553069082", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1553069082 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:05:12", PACE_SECONDS_TOLERANCE);

    done();
  });

  it("should compute grade adjusted pace of activity 1654295114", done => {
    // Given
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1654295114 as unknown) as ActivityStreamsModel;

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
    expect(result.paceData.genuineGradeAdjustedAvgPace).not.toBeNull();
    expectPace(secondsToHHMMSS(result.paceData.genuineGradeAdjustedAvgPace), "00:05:32", PACE_SECONDS_TOLERANCE);

    done();
  });
});
