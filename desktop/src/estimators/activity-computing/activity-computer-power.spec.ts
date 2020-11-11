import {
  ActivitySourceDataModel,
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  UserSettings
} from "@elevate/shared/models";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";
import { ActivityComputer } from "@elevate/shared/sync";
import streamJson_1109968202 from "../fixtures/1109968202/stream.json";
import streamJson_1302129959 from "../fixtures/1302129959/stream.json";
import streamJson_343080886 from "../fixtures/343080886/stream.json";
import streamJson_600329531 from "../fixtures/600329531/stream.json";
import streamJson_597999523 from "../fixtures/597999523/stream.json";
import streamJson_1610385844 from "../fixtures/1610385844/stream.json";
import streamJson_1811220111 from "../fixtures/1811220111/stream.json";
import streamJson_1817318910 from "../fixtures/1817318910/stream.json";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

const expectBetween = (expectValue: number, toEqual: number, tolerance: number) => {
  const lowerOk: number = toEqual - tolerance;
  const higherOk: number = toEqual + tolerance;
  const isBetween = lowerOk <= expectValue && expectValue <= higherOk;

  if (!isBetween) {
    console.error(
      "Expected '" +
        expectValue +
        "' to equals '" +
        toEqual +
        "' is not between min: '" +
        lowerOk +
        "' and max: '" +
        higherOk +
        "'.\r\n=> Lower: " +
        lowerOk +
        " <= expected: " +
        expectValue +
        " <= higher: " +
        higherOk
    );
  }
  expect(isBetween).toBeTruthy();
};

describe("ActivityComputer Cycling Power", () => {
  const activityType = ElevateSport.Ride;
  const isTrainer = false;
  const isOwner = true;
  const bounds: number[] = null;
  const returnZones = false;
  const returnPowerCurve = true;
  const smoothAltitude = true;
  const userSettingsMock: UserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
  const athleteSnapshot = new AthleteSnapshotModel(
    Gender.MEN,
    new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9)
  );
  const activitySourceData: ActivitySourceDataModel = {
    movingTime: -1,
    elevation: -1,
    distance: -1
  };

  let TOLERANCE;

  beforeEach(() => {
    TOLERANCE = 5;
  });

  it("should compute REAL power data as ESTIMATED of activity 1109968202 (IM Canada Bike)", done => {
    // Power stream is actually from real power sensor. We just said it's estimated to test to test the smoothing.

    // Given
    const hasPowerMeter = true;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1109968202 as unknown) as ActivityStreamsModel;
    athleteSnapshot.athleteSettings.cyclingFtp = 288; // ~FTP in July 2017 (Christophe B)

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(result.powerData.avgWatts, 180, TOLERANCE);
    expectBetween(_.floor(result.powerData.weightedPower), 193, TOLERANCE);
    expectBetween(_.floor(result.powerData.best20min), 223, TOLERANCE);

    done();
  });

  it("should compute REAL power data as ESTIMATED of activity 1302129959 (20-minute FTP test. First time ever!, result not bad!)", done => {
    // Given
    const hasPowerMeter = true;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1302129959 as unknown) as ActivityStreamsModel;
    athleteSnapshot.athleteSettings.cyclingFtp = 380; // ~FTP in December 2017 (Jasper Verkuijl)

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(result.powerData.avgWatts, 208, TOLERANCE);
    expectBetween(_.floor(result.powerData.weightedPower), 265, TOLERANCE);
    expectBetween(_.floor(result.powerData.best20min), 380, TOLERANCE);

    done();
  });

  it("should compute ESTIMATED power data of activity 343080886 (Alpe d'Huez)", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_343080886 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false
    athleteSnapshot.athleteSettings.cyclingFtp = 260; // ~FTP in July 2015 (Thomas Champagne)
    athleteSnapshot.athleteSettings.maxHr = 205; // in July 2015 (Thomas Champagne)
    athleteSnapshot.athleteSettings.restHr = 55; // in July 2015 (Thomas Champagne)

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 175, TOLERANCE);
    expectBetween(_.floor(result.powerData.best20min), 253, TOLERANCE);

    done();
  });

  it("should compute ESTIMATED power data of activity 600329531 (Sheep Ride)", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_600329531 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false
    athleteSnapshot.athleteSettings.cyclingFtp = 239; // ~FTP in July 2016 (Thomas Champagne)

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 178, TOLERANCE);
    expectBetween(_.floor(result.powerData.best20min), 224, TOLERANCE);

    done();
  });

  it("should compute ESTIMATED power data of activity 597999523 (4 Seigneurs x Vik + Murianette x Philippe)", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_597999523 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 142, TOLERANCE);
    expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();
    expect(result.powerData.best20min > _.floor(result.powerData.avgWatts)).toBeTruthy();

    done();
  });

  it("should compute ESTIMATED power data of activity 1610385844 (#ComeBack - 10 / 43km / 96min / 142HrSS)", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1610385844 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false
    athleteSnapshot.athleteSettings.cyclingFtp = 130; // ~FTP in May 2018 (Thomas Champagne)

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 118, TOLERANCE);
    expectBetween(_.floor(result.powerData.best20min), 145, TOLERANCE);

    done();
  });

  it("should compute ESTIMATED power data of activity 1811220111 (Brötchen suchen im Hanftal, echte 632Hm)", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1811220111 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 200, TOLERANCE);
    expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();
    expect(result.powerData.best20min > _.floor(result.powerData.avgWatts)).toBeTruthy();

    done();
  });

  it("should compute ESTIMATED power data of activity 1817318910", done => {
    // Given
    const hasPowerMeter = false;
    const stream: ActivityStreamsModel = _.cloneDeep(streamJson_1817318910 as unknown) as ActivityStreamsModel;
    stream.watts = stream.watts_calc; // because powerMeter is false

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
    const result: AnalysisDataModel = activityComputer.compute(smoothAltitude);

    // Then
    expectBetween(_.floor(result.powerData.avgWatts), 134, TOLERANCE);
    expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();

    done();
  });
});
