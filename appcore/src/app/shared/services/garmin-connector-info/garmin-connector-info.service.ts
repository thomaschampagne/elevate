import { Inject, Injectable } from "@angular/core";
import { GarminConnectorInfoDao } from "../../dao/garmin-connector-info/garmin-connector-info.dao";
import { Subject } from "rxjs";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";

@Injectable()
export class GarminConnectorInfoService {
  public info$: Subject<GarminConnectorInfo>;

  constructor(@Inject(GarminConnectorInfoDao) private readonly garminConnectorInfoDao: GarminConnectorInfoDao) {
    this.info$ = new Subject<GarminConnectorInfo>();
  }

  public fetch(): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoDao.findOne();
  }

  public update(garminConnectorInfo: GarminConnectorInfo): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoDao.update(garminConnectorInfo).then(updated => {
      this.info$.next(updated);
      return updated;
    });
  }
}
