import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { StravaConnectorInfo } from "@elevate/shared/sync";

@Injectable()
export class StravaConnectorInfoDao extends BaseDao<StravaConnectorInfo> {

    public static readonly COLLECTION_DEF: CollectionDef<StravaConnectorInfo> = new CollectionDef("stravaConnectorInfo", null);

    public getDefaultStorageValue(): StravaConnectorInfo {
        return StravaConnectorInfo.DEFAULT_MODEL;
    }

    public getCollectionDef(): CollectionDef<StravaConnectorInfo> {
        return StravaConnectorInfoDao.COLLECTION_DEF;
    }
}
