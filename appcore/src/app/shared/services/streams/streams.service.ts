import { Injectable } from "@angular/core";
import { StreamsDao } from "../../dao/streams/streams.dao";
import { CompressedStreamModel, SyncedActivityModel } from "@elevate/shared/models";

@Injectable()
export class StreamsService {

	constructor(public streamsDao: StreamsDao) {
	}

	/**
	 *
	 * @param id
	 */
	public getById(id: number | string): Promise<CompressedStreamModel> {
		return this.streamsDao.getById(<string> id);
	}

	/**
	 *
	 * @param compressedStreamModel
	 */
	public put(compressedStreamModel: CompressedStreamModel): Promise<CompressedStreamModel> {
		return (<Promise<CompressedStreamModel>> this.streamsDao.put(compressedStreamModel));
	}

	/**
	 *
	 * @param {number[]} activitiesToDelete
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public removeByIds(activitiesToDelete: (string | number)[]): Promise<CompressedStreamModel[]> {
		return this.streamsDao.removeByIds(activitiesToDelete);
	}

	public clear(): Promise<void> {
		return this.streamsDao.clear();
	}
}
