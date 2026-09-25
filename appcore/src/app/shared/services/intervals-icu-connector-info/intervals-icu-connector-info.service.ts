import { Injectable } from "@angular/core";
import { CollectionDef } from "../../data-store/collection-def";
import { IntervalsIcuConnectorInfo } from "@elevate/shared/sync/connectors/intervals-icu-connector-info.model";

@Injectable()
export class IntervalsIcuConnectorInfoService {
  /**
   * Embedded DAO. No need to extend from BaseDao. We store in local storage instead of indexed db which might be synced in future
   */
  private static IntervalsIcuConnectorInfoDao = class {
    private static readonly COLLECTION_DEF: CollectionDef<IntervalsIcuConnectorInfo> = new CollectionDef(
      "INTERVALS_ICU_CONNECTOR_INFO",
      null
    );

    public static fetch(): IntervalsIcuConnectorInfo {
      const storedConnectorInfo = localStorage.getItem(
        IntervalsIcuConnectorInfoService.IntervalsIcuConnectorInfoDao.COLLECTION_DEF.name
      );
      const connectorInfo: IntervalsIcuConnectorInfo = storedConnectorInfo ? JSON.parse(storedConnectorInfo) : null;
      if (connectorInfo) {
        return new IntervalsIcuConnectorInfo(
          connectorInfo.athleteId,
          connectorInfo.apiKey,
          connectorInfo.updateExistingNamesTypesCommutes
        );
      } else {
        return new IntervalsIcuConnectorInfo(null, null);
      }
    }

    public static save(connectorInfo: IntervalsIcuConnectorInfo): IntervalsIcuConnectorInfo {
      localStorage.setItem(
        IntervalsIcuConnectorInfoService.IntervalsIcuConnectorInfoDao.COLLECTION_DEF.name,
        JSON.stringify(connectorInfo)
      );
      return IntervalsIcuConnectorInfoService.IntervalsIcuConnectorInfoDao.fetch();
    }
  };

  public static isConfigured(connectorInfo: IntervalsIcuConnectorInfo): boolean {
    return !!connectorInfo?.athleteId?.trim() && !!connectorInfo?.apiKey?.trim();
  }

  public fetch(): IntervalsIcuConnectorInfo {
    return IntervalsIcuConnectorInfoService.IntervalsIcuConnectorInfoDao.fetch();
  }

  public save(connectorInfo: IntervalsIcuConnectorInfo): IntervalsIcuConnectorInfo {
    return IntervalsIcuConnectorInfoService.IntervalsIcuConnectorInfoDao.save(connectorInfo);
  }
}
