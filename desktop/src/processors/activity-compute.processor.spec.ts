import { ActivityComputeProcessor } from "./activity-compute.processor";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

describe("ActivityComputeProcessor", () => {
  describe("Provide activity hash", () => {
    it("should compute hash of RUN activity", done => {
      // Given
      const expectedHash = "ee3f8ce8094068dff11c09b7";
      const activity: Partial<Activity> = {
        id: "fake",
        type: ElevateSport.Run,
        startTime: "now",
        endTime: "1 hour later",
        stats: {
          distance: 10000,
          elevationGain: 122,
          speed: {
            max: 13.5
          }
        } as ActivityStats,
        hasPowerMeter: false,
        trainer: false,
        latLngCenter: [66, 33]
      };

      // When
      const hash = ActivityComputeProcessor.hash(activity);

      // Then
      expect(hash).toBeDefined();
      expect(hash.length).toEqual(24);
      expect(hash).toEqual(expectedHash);

      done();
    });
  });

  describe("Provide activity geo barycenter", () => {
    it("should find bary center of a geo stream", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: [
          [0, 0],
          [10, 20],
          [20, 0]
        ]
      };

      // When
      const latLngCenter: number[] = ActivityComputeProcessor.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toEqual([10, 10]);

      done();
    });

    it("should not find bary center of a geo stream (1)", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: []
      };

      // When
      const latLngCenter: number[] = ActivityComputeProcessor.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });

    it("should not find bary center of a geo stream (2)", done => {
      // Given
      const streams: Partial<Streams> = {
        latlng: undefined
      };

      // When
      const latLngCenter: number[] = ActivityComputeProcessor.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });

    it("should not find bary center of a geo stream (3)", done => {
      // Given
      const streams = undefined;

      // When
      const latLngCenter: number[] = ActivityComputeProcessor.geoBaryCenter(streams);

      // Then
      expect(latLngCenter).toBeNull();

      done();
    });
  });
});
