import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";

@Injectable()
export class GarminConnectorInfoDao extends BaseDao<GarminConnectorInfo> {
  public static readonly COLLECTION_DEF: CollectionDef<GarminConnectorInfo> = new CollectionDef(
    "garminConnectorInfo",
    null
  );

  public getDefaultStorageValue(): GarminConnectorInfo {
    return GarminConnectorInfo.DEFAULT_MODEL;
  }

  public getCollectionDef(): CollectionDef<GarminConnectorInfo> {
    return GarminConnectorInfoDao.COLLECTION_DEF;
  }
}
