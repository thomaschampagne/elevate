import { ActivityFlagsProcessor } from "./activity-flags.processor";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Activity, ActivityFlag, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Constant } from "@elevate/shared/constants/constant";

describe("ActivityFlagsProcessor", () => {
  it("should do nothing and return same 'user empty flags' when detected  as-is", done => {
    // Given
    const streams = new Streams();
    const activity = new Activity();
    activity.stats = new ActivityStats();
    activity.flags = null;

    // When
    const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

    // Then
    expect(flags).toBeNull();
    done();
  });

  describe("Scores", () => {
    it("should return common stress scores flags", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();

      _.set<ActivityStats>(activity.stats, "scores.stress.hrssPerHour", 300);
      _.set<ActivityStats>(activity.stats, "scores.stress.pssPerHour", 300);
      _.set<ActivityStats>(activity.stats, "scores.stress.rssPerHour", 300);
      _.set<ActivityStats>(activity.stats, "scores.stress.sssPerHour", 300);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SCORE_HRSS_PER_HOUR_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.SCORE_PSS_PER_HOUR_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.SCORE_RSS_PER_HOUR_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.SCORE_SSS_PER_HOUR_ABNORMAL) !== -1).toBeTruthy();
      done();
    });
  });

  describe("Averages", () => {
    it("should return common avg flags (cycling)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.Ride;

      _.set<ActivityStats>(activity.stats, "speed.avg", 61);
      _.set<ActivityStats>(activity.stats, "heartRate.avg", 196);
      _.set<ActivityStats>(activity.stats, "power.avgKg", 8);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_AVG_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.HR_AVG_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.POWER_AVG_KG_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return common avg flags (running)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.Run;

      _.set<ActivityStats>(activity.stats, "speed.avg", 23);
      _.set<ActivityStats>(activity.stats, "heartRate.avg", 196);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_AVG_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.HR_AVG_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return common avg flags (swimming)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.Swim;

      _.set<ActivityStats>(activity.stats, "speed.avg", 9);
      _.set<ActivityStats>(activity.stats, "heartRate.avg", 196);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_AVG_ABNORMAL) !== -1).toBeTruthy();
      expect(_.indexOf(flags, ActivityFlag.HR_AVG_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return common avg flags (other)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.Other;

      _.set<ActivityStats>(activity.stats, "heartRate.avg", 196);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.HR_AVG_ABNORMAL) !== -1).toBeTruthy();
      done();
    });
  });

  describe("Thresholds", () => {
    it("should return power threshold flag (cycling)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();

      _.set<ActivityStats>(activity.stats, "power.best20min", 551);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.POWER_THRESHOLD_ABNORMAL) !== -1).toBeTruthy();
      done();
    });
  });

  describe("Pace specifics", () => {
    it("should return flag when average pace is faster than grade adjusted pace (running)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.Run;

      _.set<ActivityStats>(activity.stats, "pace.avg", 300);
      _.set<ActivityStats>(activity.stats, "pace.gapAvg", 301);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.PACE_AVG_FASTER_THAN_GAP) !== -1).toBeTruthy();
      done();
    });
  });

  describe("Time specifics", () => {
    it("should return flag when moving time greater than elapsed time", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.stats = new ActivityStats();
      activity.type = ElevateSport.VirtualRide;

      _.set<ActivityStats>(activity.stats, "movingTime", 1001);
      _.set<ActivityStats>(activity.stats, "elapsedTime", 1000);

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.MOVING_TIME_GREATER_THAN_ELAPSED) !== -1).toBeTruthy();
      done();
    });
  });

  describe("Streams", () => {
    it("should return flag when speed std dev is inappropriate (cycling)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.type = ElevateSport.Ride;
      streams.velocity_smooth = [10, 65, 10, 65, 10, 65, 10].map(v => v / Constant.MPS_KPH_FACTOR); // std dev: ~27 kph

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_STD_DEV_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return flag when speed std dev is inappropriate (running)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.type = ElevateSport.Run;
      streams.velocity_smooth = [5, 36, 5, 36, 5, 36, 5].map(v => v / Constant.MPS_KPH_FACTOR); // std dev: ~15.3 kph

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_STD_DEV_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return flag when speed std dev is inappropriate (swimming)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.type = ElevateSport.Swim;
      streams.velocity_smooth = [0.3, 11, 0.3, 11, 0.3, 11, 0.3].map(v => v / Constant.MPS_KPH_FACTOR); // std dev: ~5.3 kph

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_STD_DEV_ABNORMAL) !== -1).toBeTruthy();
      done();
    });

    it("should return flag when speed std dev is inappropriate (other)", done => {
      // Given
      const streams = new Streams();
      const activity = new Activity();
      activity.type = ElevateSport.Other;
      streams.velocity_smooth = [10, 65, 10, 65, 10, 65, 10].map(v => v / Constant.MPS_KPH_FACTOR); // std dev: ~27 kph

      // When
      const flags: ActivityFlag[] = ActivityFlagsProcessor.verify(activity, streams);

      // Then
      expect(_.indexOf(flags, ActivityFlag.SPEED_STD_DEV_ABNORMAL) !== -1).toBeTruthy();
      done();
    });
  });
});
