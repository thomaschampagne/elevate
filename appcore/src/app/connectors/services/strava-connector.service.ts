import { Injectable } from "@angular/core";
import {
    ConnectorType,
    StravaAccount,
    StravaConnectorInfo,
    StravaCredentialsUpdateSyncEvent,
    SyncEventType
} from "@elevate/shared/sync";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { filter } from "rxjs/operators";
import { Gender } from "@elevate/shared/models";
import { IpcMessagesSender } from "../../desktop/ipc-messages/ipc-messages-sender.service";
import * as _ from "lodash";

@Injectable()
export class StravaConnectorService {

    public stravaConnectorInfo: StravaConnectorInfo;
    public stravaConnectorInfo$: Subject<StravaConnectorInfo>;

    constructor(public stravaConnectorInfoService: StravaConnectorInfoService,
                public ipcMessagesSender: IpcMessagesSender,
                public syncService: DesktopSyncService,
                public logger: LoggerService) {

        this.stravaConnectorInfo$ = new Subject<StravaConnectorInfo>();
    }

    public fetch(): Promise<StravaConnectorInfo> {
        return this.stravaConnectorInfoService.fetch();
    }

    /**
     * Promise updated StravaConnectorInfo with proper access & refresh token
     */
    public authenticate(): Promise<StravaConnectorInfo> {

        return this.fetch().then((stravaConnectorInfo: StravaConnectorInfo) => {

            this.stravaConnectorInfo = stravaConnectorInfo;

            const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.LINK_STRAVA_CONNECTOR, this.stravaConnectorInfo.clientId,
                this.stravaConnectorInfo.clientSecret, this.stravaConnectorInfo.refreshToken);

            return this.ipcMessagesSender
                .send<{ accessToken: string, refreshToken: string, expiresAt: number, athlete: any }>(flaggedIpcMessage);

        }).then(result => {
            this.stravaConnectorInfo.accessToken = result.accessToken;
            this.stravaConnectorInfo.refreshToken = result.refreshToken;
            this.stravaConnectorInfo.expiresAt = result.expiresAt;
            this.stravaConnectorInfo.stravaAccount = new StravaAccount(result.athlete.id, result.athlete.username, result.athlete.firstname,
                result.athlete.lastname, result.athlete.city, result.athlete.state, result.athlete.country,
                result.athlete.sex === "M" ? Gender.MEN : Gender.WOMEN);
            return this.stravaConnectorInfoService.update(this.stravaConnectorInfo);

        }).then((stravaConnectorInfo: StravaConnectorInfo) => {

            return Promise.resolve(stravaConnectorInfo);

        }).catch(error => {
            return Promise.reject(error);
        });
    }

    /**
     *
     */
    public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {

        const desktopSyncService = this.syncService as DesktopSyncService;

        // Subscribe to listen for StravaCredentialsUpdate (case where refresh token is performed)
        desktopSyncService.syncEvents$.pipe(
            filter(syncEvent => (syncEvent.type === SyncEventType.STRAVA_CREDENTIALS_UPDATE))
        ).subscribe((stravaCredentialsUpdateSyncEvent: StravaCredentialsUpdateSyncEvent) => {

            this.stravaConnectorInfoService.fetch().then(stravaConnectorInfo => {
                stravaConnectorInfo = _.assign(stravaConnectorInfo, stravaCredentialsUpdateSyncEvent.stravaConnectorInfo);
                return this.stravaConnectorInfoService.update(stravaConnectorInfo);
            }).then((stravaConnectorInfo: StravaConnectorInfo) => {
                this.stravaConnectorInfo$.next(stravaConnectorInfo);
            });

        });

        return desktopSyncService.sync(fastSync, forceSync, ConnectorType.STRAVA);
    }

}
