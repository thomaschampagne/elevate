import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CompressedStreamModel } from "@elevate/shared/models";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import * as _ from "lodash";

@Injectable()
export class StreamsDao extends BaseDao<CompressedStreamModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("streams", StorageType.COLLECTION,
		CompressedStreamModel.ID_FIELD);
	public static readonly DEFAULT_STORAGE_VALUE: CompressedStreamModel[] = [];

	public getStorageLocation(): StorageLocationModel {
		return StreamsDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): CompressedStreamModel[] | CompressedStreamModel {
		return StreamsDao.DEFAULT_STORAGE_VALUE;
	}

	/**
	 *
	 * @param {number[]} streamsToDelete
	 * @returns {Promise<CompressedStreamModel[]>}
	 */
	public removeByIds(streamsToDelete: (string | number)[]): Promise<CompressedStreamModel[]> {
		return this.fetch().then((models: CompressedStreamModel[]) => {
			const modelsToBeSaved = _.filter(models, (compressedStreamModel: CompressedStreamModel) => {
				return (_.indexOf(streamsToDelete, compressedStreamModel.activityId) === -1);
			});
			return (<Promise<CompressedStreamModel[]>> this.save(modelsToBeSaved));
		});
	}

}
