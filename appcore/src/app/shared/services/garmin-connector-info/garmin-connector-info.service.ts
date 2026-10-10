import { Inject, Injectable } from "@angular/core";
import { CollectionDef } from "../../data-store/collection-def";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

/**
 * Persists the Garmin Connect connector configuration (username + OAuth tokens).
 *
 * Tokens are stored in local storage (never the password). This mirrors the
 * FileConnectorInfoService approach: no indexed db, kept out of backups/sync.
 */
@Injectable()
export class GarminConnectorInfoService {
  private static GarminConnectorInfoDao = class {
    private static readonly COLLECTION_DEF: CollectionDef<GarminConnectorInfo> = new CollectionDef(
      "GARMIN_CONNECTOR_INFO",
      null
    );
    private static readonly DEFAULT_STORAGE_VALUE: GarminConnectorInfo = GarminConnectorInfo.DEFAULT_MODEL;

    public static fetch(): GarminConnectorInfo {
      const storedConnectorInfo = localStorage.getItem(
        GarminConnectorInfoService.GarminConnectorInfoDao.COLLECTION_DEF.name
      );
      const connectorInfo: GarminConnectorInfo = storedConnectorInfo ? JSON.parse(storedConnectorInfo) : null;
      if (connectorInfo) {
        return new GarminConnectorInfo(
          connectorInfo.username,
          connectorInfo.oauth1Token,
          connectorInfo.oauth2Token,
          connectorInfo.expiresAt,
          connectorInfo.displayName
        );
      } else {
        return GarminConnectorInfoService.GarminConnectorInfoDao.DEFAULT_STORAGE_VALUE;
      }
    }

    public static save(garminConnectorInfo: GarminConnectorInfo): GarminConnectorInfo {
      localStorage.setItem(
        GarminConnectorInfoService.GarminConnectorInfoDao.COLLECTION_DEF.name,
        JSON.stringify(garminConnectorInfo)
      );
      return GarminConnectorInfoService.GarminConnectorInfoDao.fetch();
    }
  };

  constructor(@Inject(ConnectorSyncDateTimeDao) private readonly connectorSyncDateTimeDao: ConnectorSyncDateTimeDao) {}

  public fetch(): GarminConnectorInfo {
    return GarminConnectorInfoService.GarminConnectorInfoDao.fetch();
  }

  public save(garminConnectorInfo: GarminConnectorInfo): GarminConnectorInfo {
    return GarminConnectorInfoService.GarminConnectorInfoDao.save(garminConnectorInfo);
  }

  public clear(): Promise<void> {
    this.save(GarminConnectorInfo.DEFAULT_MODEL);
    return this.connectorSyncDateTimeDao.removeByConnectorType(ConnectorType.GARMIN);
  }

  public isLinked(): boolean {
    const info = this.fetch();
    return !!(info && info.oauth1Token && info.oauth2Token);
  }
}
