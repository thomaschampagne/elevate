import { Inject, Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import {
  ProcessStreamMode,
  StreamProcessor,
  StreamProcessorParams
} from "@elevate/shared/sync/compute/stream-processor";
import { DeflatedActivityStreams } from "@elevate/shared/models/sync/deflated-activity.streams";

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
    processMode: ProcessStreamMode,
    id: number | string,
    params: StreamProcessorParams
  ): Promise<Streams> {
    return this.getInflatedById(id).then(streams => {
      return Promise.resolve(streams ? StreamProcessor.handle(processMode, params, streams) : null);
    });
  }

  public put(streamsModel: DeflatedActivityStreams): Promise<DeflatedActivityStreams> {
    return this.streamsDao.put(streamsModel);
  }

  public removeById(id: number | string): Promise<void> {
    return this.streamsDao.removeById(id);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.streamsDao.removeByManyIds(activitiesToDelete);
  }

  public clear(): Promise<void> {
    return this.streamsDao.clear();
  }
}
