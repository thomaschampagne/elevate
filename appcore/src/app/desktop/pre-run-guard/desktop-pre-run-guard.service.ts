import { Inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { FlaggedIpcMessage, MessageFlag, RuntimeInfo } from "@elevate/shared/electron";
import { concatMap, delay, retryWhen } from "rxjs/operators";
import { of, throwError } from "rxjs";
import { AthleteAccessChecker } from "./athlete-access-checker";
import * as HttpCodes from "http-status-codes";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { environment } from "../../../environments/environment.desktop";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../shared/services/versions/versions-provider.interface";
import { StravaConnectorInfo } from "@elevate/shared/sync";
import { DesktopMigrationService } from "../migration/desktop-migration.service";
import { ElevateException } from "@elevate/shared/exceptions";
import { DesktopPreRunGuardDialogComponent } from "./desktop-pre-run-guard-dialog.component";
import { IpcMessagesSender } from "../ipc-messages/ipc-messages-sender.service";

@Injectable()
export class DesktopPreRunGuard implements CanActivate {

    private static readonly ATHLETE_ACCESS_API_URL = "https://api.elevate.duckdns.org/api/athlete/access";

    private static readonly AUTH_RETRY_COUNT = 1;
    private static readonly AUTH_RETRY_DELAY = 1000;

    public runtimeInfo: RuntimeInfo;
    public isAccessAuthorized: boolean;

    constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
                public ipcMessagesSender: IpcMessagesSender,
                public stravaConnectorInfoService: StravaConnectorInfoService,
                public desktopMigrationService: DesktopMigrationService,
                public httpClient: HttpClient,
                public router: Router,
                public dialog: MatDialog,
                public logger: LoggerService) {
        this.runtimeInfo = null;
        this.isAccessAuthorized = false;
    }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

        if (this.isAccessAuthorized || environment.bypassAthleteAccessCheck) {
            return Promise.resolve(true);
        }

        return this.desktopMigrationService.upgrade().then(() => {
            return this.getRuntimeInfo();
        }).then(runtimeInfo => {
            this.runtimeInfo = runtimeInfo;
        }).then(() => {
            return this.checkAthleteAccess(this.runtimeInfo);
        }).then(accessAuthorized => {

            this.isAccessAuthorized = accessAuthorized;

            if (!accessAuthorized) {
                this.dialog.open(DesktopPreRunGuardDialogComponent, {
                    minHeight: "100%",
                    maxHeight: "100%",
                    minWidth: "100%",
                    maxWidth: "100%",
                    width: "100%",
                    height: "100%",
                    hasBackdrop: true,
                    closeOnNavigation: false,
                    disableClose: true,
                    data: this.runtimeInfo.athleteMachineId
                });
            }

            return Promise.resolve(accessAuthorized);
        }).catch(error => {
            this.logger.error(error);
            throw new ElevateException(error);
        });
    }

    public getRuntimeInfo(): Promise<RuntimeInfo> {
        return this.ipcMessagesSender.send<RuntimeInfo>(new FlaggedIpcMessage(MessageFlag.GET_RUNTIME_INFO));
    }

    public checkAthleteAccess(runtimeInfo: RuntimeInfo, authRetry: boolean = false): Promise<boolean> {

        return Promise.all([
            this.versionsProvider.getPackageVersion(),
            this.stravaConnectorInfoService.fetch()
        ]).then(result => {

            const installedVersion = result[0];
            const stravaConnectorInfo: StravaConnectorInfo = result[1];

            return new Promise<boolean>((resolve => {

                const athleteAccessBodyData = {
                    athleteMachineId: this.runtimeInfo.athleteMachineId,
                    version: {
                        name: installedVersion
                    },
                    osPlatform: `${this.runtimeInfo.osPlatform.name}; ${this.runtimeInfo.osPlatform.arch}`,
                    osUsername: this.runtimeInfo.osUsername,
                    memorySizeGb: this.runtimeInfo.memorySizeGb,
                    cpu: `${this.runtimeInfo.cpu.name}; ${this.runtimeInfo.cpu.threads}`,
                    stravaAccount: (stravaConnectorInfo.stravaAccount) ? stravaConnectorInfo.stravaAccount : null
                };

                this.httpClient.post(DesktopPreRunGuard.ATHLETE_ACCESS_API_URL, athleteAccessBodyData, {responseType: "text"}).pipe(
                    retryWhen(errors => errors.pipe(concatMap((error: HttpErrorResponse, tryIndex: number) => {
                        if (error.status === HttpCodes.UNAUTHORIZED) {
                            return throwError(error);
                        }
                        return ((tryIndex + 1) > DesktopPreRunGuard.AUTH_RETRY_COUNT)
                            ? throwError(error) : of(error).pipe(delay(DesktopPreRunGuard.AUTH_RETRY_DELAY));
                    })))
                ).subscribe(authCode => {
                    const authenticated = this.verifyAthleteMachineId(this.runtimeInfo.athleteMachineId, authCode);

                    if (authenticated) {
                        resolve(authenticated);
                    } else if (authRetry) {
                        resolve(authenticated);
                    } else {
                        setTimeout(() => {
                            this.logger.info("Retry machine authentication");
                            this.checkAthleteAccess(runtimeInfo, true).then(isAuthenticated => {
                                resolve(isAuthenticated);
                            });
                        }, DesktopPreRunGuard.AUTH_RETRY_DELAY);
                    }
                }, error => {
                    resolve(false);
                });

            }));

        });

    }

    public verifyAthleteMachineId(athleteMachineId: string, remoteAuthCode: string): boolean {
        return AthleteAccessChecker.test(athleteMachineId, remoteAuthCode);
    }
}

