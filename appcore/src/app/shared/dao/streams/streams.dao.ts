import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { DeflatedActivityStreams } from "@elevate/shared/models";
import { CollectionDef } from "../../data-store/collection-def";

@Injectable()
export class StreamsDao extends BaseDao<DeflatedActivityStreams> {
  public static readonly COLLECTION_DEF: CollectionDef<DeflatedActivityStreams> = new CollectionDef("streams", {
    unique: ["activityId"]
  });

  public getCollectionDef(): CollectionDef<DeflatedActivityStreams> {
    return StreamsDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): DeflatedActivityStreams[] {
    return [];
  }
}
