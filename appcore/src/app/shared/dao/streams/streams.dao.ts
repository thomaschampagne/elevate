import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CompressedStreamModel } from "@elevate/shared/models";
import { CollectionDef } from "../../data-store/collection-def";

@Injectable()
export class StreamsDao extends BaseDao<CompressedStreamModel> {
  public static readonly COLLECTION_DEF: CollectionDef<CompressedStreamModel> = new CollectionDef("streams", {
    unique: ["activityId"],
  });

  public getCollectionDef(): CollectionDef<CompressedStreamModel> {
    return StreamsDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): CompressedStreamModel[] {
    return [];
  }
}
