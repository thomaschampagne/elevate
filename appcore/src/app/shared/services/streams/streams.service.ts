import { Inject, Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { ActivityStreamsModel, CompressedStreamModel } from "@elevate/shared/models";

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
