import { Inject, Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { ActivityStreamsModel, AthleteSnapshotModel, CompressedStreamModel } from "@elevate/shared/models";
import { StreamProcessor } from "@elevate/shared/sync";
import { ElevateSport } from "@elevate/shared/enums";
import { WarningException } from "@elevate/shared/exceptions";

@Injectable()
export class StreamsService {
  constructor(@Inject(StreamsDao) private readonly streamsDao: StreamsDao) {}

  public getById(id: number | string): Promise<CompressedStreamModel> {
    return this.streamsDao.getById(id);
  }

  public getInflatedById(id: number | string): Promise<ActivityStreamsModel> {
    return this.getById(id).then(compressed => {
      if (compressed) {
        return Promise.resolve(ActivityStreamsModel.inflate(compressed.data));
      } else {
        return Promise.resolve(null);
      }
    });
  }

  public getProcessedById(
    id: number | string,
    activityParams: { type: ElevateSport; hasPowerMeter: boolean; athleteSnapshot: AthleteSnapshotModel }
  ): Promise<ActivityStreamsModel> {
    const errorCallback = err => {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    };

    return this.getInflatedById(id).then(streams => {
      return Promise.resolve(streams ? StreamProcessor.handle(activityParams, streams, errorCallback) : null);
    });
  }

  public put(compressedStreamModel: CompressedStreamModel): Promise<CompressedStreamModel> {
    return this.streamsDao.put(compressedStreamModel);
  }

  public removeById(id: number | string): Promise<void> {
    return this.streamsDao.removeById(id, true);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.streamsDao.removeByManyIds(activitiesToDelete);
  }

  public clear(persistImmediately: boolean = false): Promise<void> {
    return this.streamsDao.clear(persistImmediately);
  }
}
