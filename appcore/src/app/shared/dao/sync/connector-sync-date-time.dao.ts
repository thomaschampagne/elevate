import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync/connector-sync-date-time.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

@Injectable()
export class ConnectorSyncDateTimeDao extends BaseDao<ConnectorSyncDateTime> {
  public static readonly COLLECTION_DEF: CollectionDef<ConnectorSyncDateTime> = new CollectionDef(
    "connectorSyncDateTime",
    {
      unique: ["connectorType"]
    }
  );

  public getDefaultStorageValue(): ConnectorSyncDateTime[] {
    return [];
  }

  public getCollectionDef(): CollectionDef<ConnectorSyncDateTime> {
    return ConnectorSyncDateTimeDao.COLLECTION_DEF;
  }

  public removeByConnectorType(connectorType: ConnectorType) {
    return this.removeById(connectorType);
  }
}
