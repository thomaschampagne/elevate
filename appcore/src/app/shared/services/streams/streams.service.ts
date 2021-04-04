import { Inject, Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { AthleteSnapshotModel, DeflatedActivityStreams, Streams } from "@elevate/shared/models";
import { StreamProcessor } from "@elevate/shared/sync";
import { ElevateSport } from "@elevate/shared/enums";
import { WarningException } from "@elevate/shared/exceptions";

@Injectable()
export class StreamsService {
  constructor(@Inject(StreamsDao) private readonly streamsDao: StreamsDao) {}

  public getById(id: number | string): Promise<DeflatedActivityStreams> {
    return this.streamsDao.getById(id);
  }

  public getInflatedById(id: number | string): Promise<Streams> {
    return this.getById(id).then(deflated => {
      if (deflated) {
        return Promise.resolve(Streams.inflate(deflated.deflatedStreams));
      } else {
        return Promise.resolve(null);
      }
    });
  }

  public getProcessedById(
    id: number | string,
    activityParams: { type: ElevateSport; hasPowerMeter: boolean; athleteSnapshot: AthleteSnapshotModel }
  ): Promise<Streams> {
    const errorCallback = err => {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    };

    return this.getInflatedById(id).then(streams => {
      return Promise.resolve(streams ? StreamProcessor.handle(activityParams, streams, errorCallback) : null);
    });
  }

  public put(streamsModel: DeflatedActivityStreams): Promise<DeflatedActivityStreams> {
    return this.streamsDao.put(streamsModel, false);
  }

  public removeById(id: number | string): Promise<void> {
    return this.streamsDao.removeById(id, false);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.streamsDao.removeByManyIds(activitiesToDelete, false);
  }

  public clear(): Promise<void> {
    return this.streamsDao.clear(false);
  }
}
