import { Inject, Injectable } from "@angular/core";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { filter } from "rxjs/operators";
import _ from "lodash";
import { LoggerService } from "../logging/logger.service";
import { Subject } from "rxjs";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { StravaCredentialsUpdateSyncEvent } from "@elevate/shared/sync/events/strava-credentials-update-sync.event";

@Injectable()
export class StravaConnectorInfoService {
  public info$: Subject<StravaConnectorInfo>;

  constructor(
    @Inject(StravaConnectorInfoDao) private readonly stravaConnectorInfoDao: StravaConnectorInfoDao,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.info$ = new Subject<StravaConnectorInfo>();
  }

  public fetch(): Promise<StravaConnectorInfo> {
    return this.stravaConnectorInfoDao.findOne();
  }

  public update(stravaConnectorInfo: StravaConnectorInfo): Promise<StravaConnectorInfo> {
    return this.stravaConnectorInfoDao.update(stravaConnectorInfo);
  }

  /**
   * Subscribe to listen for StravaCredentialsUpdate (case where refresh token is performed)
   */
  public listenForCredentialsUpdates(syncEvents$: Subject<SyncEvent>): void {
    this.logger.debug(`Listening for updated stravaConnectorInfo`);
    syncEvents$
      .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STRAVA_CREDENTIALS_UPDATE))
      .subscribe((stravaCredentialsUpdateSyncEvent: StravaCredentialsUpdateSyncEvent) => {
        this.fetch()
          .then(stravaConnectorInfo => {
            stravaConnectorInfo = _.assign(stravaConnectorInfo, stravaCredentialsUpdateSyncEvent.stravaConnectorInfo);
            return this.update(stravaConnectorInfo);
          })
          .then((stravaConnectorInfo: StravaConnectorInfo) => {
            this.logger.debug(`Strava stravaConnectorInfo updated with`, stravaConnectorInfo);
            this.info$.next(stravaConnectorInfo);
          });
      });
  }
}
