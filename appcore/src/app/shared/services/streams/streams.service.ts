import { Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { CompressedStreamModel } from "@elevate/shared/models";

@Injectable()
export class StreamsService {

    constructor(public streamsDao: StreamsDao) {
    }

    public getById(id: number | string): Promise<CompressedStreamModel> {
        return this.streamsDao.getById(id);
    }

    public put(compressedStreamModel: CompressedStreamModel): Promise<CompressedStreamModel> {
        return this.streamsDao.put(compressedStreamModel);
    }

    public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
        return this.streamsDao.removeByManyIds(activitiesToDelete);
    }

    public clear(persistImmediately: boolean = false): Promise<void> {
        return this.streamsDao.clear(persistImmediately);
    }
}
