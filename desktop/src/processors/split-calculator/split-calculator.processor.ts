import { singleton } from "tsyringe";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Movement } from "@elevate/shared/tools/movement";
import { SplitRequest } from "@elevate/shared/models/splits/split-request.model";
import { SplitResponse } from "@elevate/shared/models/splits/split-response.model";
import { SplitCalculator } from "@elevate/shared/sync/compute/split-calculator";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";

@singleton()
export class SplitCalculatorProcessor {
  private static readonly VALUE_CONVERT_BY_STREAM_KEY_MAP = new Map<
    keyof Streams | string,
    (value: number, sport: ElevateSport) => number
  >([
    [
      "velocity_smooth",
      (mps: number, sport: ElevateSport) => {
        const kph = mps * Constant.MPS_KPH_FACTOR;
        if (Activity.isPaced(sport)) {
          return Movement.speedToPace(kph);
        }
        return kph;
      }
    ]
  ]);

  public computeSplits(splitRequest: SplitRequest): Promise<SplitResponse> {
    const results: { streamKey: string; value: number; indexes: number[] }[] = [];

    splitRequest.dataStreams.forEach(dataStream => {
      try {
        const splitCalculator = new SplitCalculator(splitRequest.scaleStream, dataStream.stream);
        const splitResult = splitCalculator.compute(splitRequest.range);

        // Check if for given streamKey value has to be converted (e.g. speed to kph, pace as seconds/km)
        const valueFunction = SplitCalculatorProcessor.VALUE_CONVERT_BY_STREAM_KEY_MAP.get(dataStream.streamKey);

        // If function exists then, then call it to get the value, else use provided value (e.g. watts)
        const value = valueFunction ? valueFunction(splitResult.value, splitRequest.sport) : splitResult.value;

        results.push({
          streamKey: dataStream.streamKey,
          value: value,
          indexes: [splitResult.start, splitResult.end]
        });
      } catch (err) {
        if (!(err instanceof WarningException)) {
          throw err;
        }
      }
    });

    return Promise.resolve({
      type: splitRequest.type,
      range: splitRequest.range,
      results: results
    });
  }
}
