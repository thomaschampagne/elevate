import { ActivityStreamsModel } from "../../models";
import { meanWindowSmoothing, medianFilter, percentile } from "../../tools";
import _ from "lodash";

export class StreamShaper {
  private static readonly DEFAULT_MEAN_FILTER_WINDOW = 5;
  private static readonly ALTITUDE_MEAN_FILTER_WINDOW = 7;
  private static readonly HR_MEAN_FILTER_WINDOW = 2;
  private static readonly DEFAULT_MEDIAN_FILTER_WINDOW = 9;
  private static readonly HUMAN_MAX_HR = 220;

  public static sculpt(
    streams: ActivityStreamsModel,
    hasVelocityAsPace: boolean,
    hasPowerMeter: boolean
  ): ActivityStreamsModel {
    if (!streams) {
      return null;
    }

    if (streams.altitude?.length > 0) {
      streams.altitude = meanWindowSmoothing(streams.altitude, StreamShaper.ALTITUDE_MEAN_FILTER_WINDOW); // Seems good
    }

    if (streams.velocity_smooth?.length > 0) {
      // Remove speed pikes before
      streams.velocity_smooth = medianFilter(streams.velocity_smooth, StreamShaper.DEFAULT_MEDIAN_FILTER_WINDOW);

      // If activity is paced (run, swim, ..) remove unwanted artifacts such as infinite pace when speed if zero
      // For this we take 1% and 99% percentiles values on which we will clamp the stream
      if (hasVelocityAsPace) {
        const lowHighPercentiles = StreamShaper.lowHighPercentiles(streams.velocity_smooth, 1);
        streams.velocity_smooth = StreamShaper.clampStream(
          streams.velocity_smooth,
          lowHighPercentiles[0],
          lowHighPercentiles[1]
        );
      }

      streams.velocity_smooth = meanWindowSmoothing(streams.velocity_smooth, StreamShaper.DEFAULT_MEAN_FILTER_WINDOW);
    }

    // if (streams.watts?.length > 0) {
    if (!hasPowerMeter && streams.watts?.length > 0) {
      streams.watts = meanWindowSmoothing(streams.watts, StreamShaper.DEFAULT_MEAN_FILTER_WINDOW);
    }

    if (streams.heartrate?.length > 0) {
      // Getting low value percentile to clamp heart rate stream
      // between this low hr and maximum human possible HR.
      const lowHighPercentiles = StreamShaper.lowHighPercentiles(streams.heartrate, 1);
      streams.heartrate = StreamShaper.clampStream(streams.heartrate, lowHighPercentiles[0], StreamShaper.HUMAN_MAX_HR);
      streams.heartrate = meanWindowSmoothing(streams.heartrate, StreamShaper.HR_MEAN_FILTER_WINDOW);
    }

    if (streams.cadence?.length > 0) {
      // Remove cadence pikes before
      streams.cadence = medianFilter(streams.cadence, StreamShaper.DEFAULT_MEDIAN_FILTER_WINDOW);
    }

    return streams;
  }

  /**
   * Return by default very low and very high percentiles (1%)
   */
  private static lowHighPercentiles(stream: number[], percentage: number = 1): number[] {
    const pRatio = percentage / 100;
    const sortedArrayAsc = _.cloneDeep(stream).sort((a, b) => a - b);
    return [percentile(sortedArrayAsc, pRatio), percentile(sortedArrayAsc, 1 - pRatio)];
  }

  private static clampStream(stream: number[], lowValue: number, highValue: number): number[] {
    return stream.map(value => {
      return _.clamp(value, lowValue, highValue);
    });
  }
}
