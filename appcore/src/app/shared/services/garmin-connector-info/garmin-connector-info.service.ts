import { Inject, Injectable } from "@angular/core";
import { GarminConnectorInfoDao } from "../../dao/garmin-connector-info/garmin-connector-info.dao";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";

@Injectable()
export class GarminConnectorInfoService {
  constructor(@Inject(GarminConnectorInfoDao) private readonly garminConnectorInfoDao: GarminConnectorInfoDao) {}

  public fetch(): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoDao.findOne();
  }

  public update(garminConnectorInfo: GarminConnectorInfo): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoDao.update(garminConnectorInfo);
  }

  public isConfigured(garminConnectorInfo: GarminConnectorInfo): boolean {
    return !!garminConnectorInfo?.apiKey?.trim();
  }
}
