import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { DeflatedActivityStreams } from "@elevate/shared/models/sync/deflated-activity.streams";

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
