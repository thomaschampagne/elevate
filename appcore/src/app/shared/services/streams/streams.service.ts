import { Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { CompressedStreamModel } from "@elevate/shared/models";

@Injectable()
export class StreamsService {

    constructor(public streamsDao: StreamsDao) {
    }

    public getById(id: number | string): Promise<CompressedStreamModel> {
        return this.streamsDao.getById(<string> id);
    }

    public put(compressedStreamModel: CompressedStreamModel): Promise<CompressedStreamModel> {
        return (<Promise<CompressedStreamModel>> this.streamsDao.put(compressedStreamModel));
    }

    public removeByIds(activitiesToDelete: (string | number)[]): Promise<CompressedStreamModel[]> {
        return this.streamsDao.removeByIds(activitiesToDelete);
    }

    public clear(): Promise<void> {
        return this.streamsDao.clear();
    }
}
