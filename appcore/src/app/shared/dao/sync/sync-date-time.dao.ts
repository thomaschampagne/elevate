import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";

@Injectable()
export class SyncDateTimeDao extends BaseDao<SyncDateTime> {

    public static readonly COLLECTION_DEF: CollectionDef<SyncDateTime> = new CollectionDef("syncDateTime", null);

    public getDefaultStorageValue(): SyncDateTime {
        return new SyncDateTime(null);
    }

    public getCollectionDef(): CollectionDef<SyncDateTime> {
        return SyncDateTimeDao.COLLECTION_DEF;
    }
}
