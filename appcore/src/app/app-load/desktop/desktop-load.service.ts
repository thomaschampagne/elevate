import { Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { FlaggedIpcMessage, MessageFlag, RuntimeInfo } from "@elevate/shared/electron";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { environment } from "../../../environments/environment";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../shared/services/versions/versions-provider.interface";
import { AppLoadService } from "../app-load.service";
import { concatMap, delay, retryWhen } from "rxjs/operators";
import { of, throwError } from "rxjs";
import { AthleteAccessChecker } from "./athlete-access-checker";
import { StatusCodes } from "http-status-codes";
import { StravaConnectorInfo } from "@elevate/shared/sync";
import { DesktopUnauthorizedMachineIdDialogComponent } from "./desktop-unauthorized-machine-id-dialog/desktop-unauthorized-machine-id-dialog.component";
import { IpcMessagesSender } from "../../desktop/ipc-messages/ipc-messages-sender.service";
import { DesktopMigrationService } from "../../desktop/migration/desktop-migration.service";
import { DataStore } from "../../shared/data-store/data-store";

@Injectable()
export class DesktopLoadService extends AppLoadService {

    private static readonly ATHLETE_ACCESS_API_URL = "https://api.elevate.duckdns.org/api/athlete/access";
    private static readonly AUTH_RETRY_COUNT = 1;
    private static readonly AUTH_RETRY_DELAY = 1000;

    public runtimeInfo: RuntimeInfo;

    constructor(@Inject(DataStore) protected readonly dataStore: DataStore<object>,
                @Inject(VERSIONS_PROVIDER) private readonly versionsProvider: VersionsProvider,
                private readonly ipcMessagesSender: IpcMessagesSender,
                private readonly stravaConnectorInfoService: StravaConnectorInfoService,
                private readonly desktopMigrationService: DesktopMigrationService,
                private readonly httpClient: HttpClient,
                private readonly router: Router,
                private readonly dialog: MatDialog,
                private readonly logger: LoggerService) {
        super(dataStore);
        this.runtimeInfo = null;
    }

    public loadApp(): Promise<void> {

        return super.loadApp().then(() => {

            return this.desktopMigrationService.upgrade().then(() => {

                if ((<any> environment).bypassAthleteAccessCheck) {
                    return Promise.resolve();

                } else {

                    return this.getRuntimeInfo().then(runtimeInfo => {
                        this.runtimeInfo = runtimeInfo;
                    }).then(() => {
                        return this.checkAthleteAccess(this.runtimeInfo);
                    }).then(accessAuthorized => {

                        if (!accessAuthorized) {
                            this.dialog.open(DesktopUnauthorizedMachineIdDialogComponent, {
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

                            return Promise.reject(`Access non-authorized for machine: ${this.runtimeInfo.athleteMachineId}`);
                        }

                        return Promise.resolve();

                    }).catch(error => {
                        this.logger.error(error);
                        return Promise.reject(error);
                    });
                }
            });

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
            const stravaConnectorInfo: StravaConnectorInfo = result[1] as StravaConnectorInfo;

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

                this.httpClient.post(DesktopLoadService.ATHLETE_ACCESS_API_URL, athleteAccessBodyData, {responseType: "text"}).pipe(
                    retryWhen(errors => errors.pipe(concatMap((error: HttpErrorResponse, tryIndex: number) => {
                        if (error.status === StatusCodes.UNAUTHORIZED) {
                            return throwError(error);
                        }
                        return ((tryIndex + 1) > DesktopLoadService.AUTH_RETRY_COUNT)
                            ? throwError(error) : of(error).pipe(delay(DesktopLoadService.AUTH_RETRY_DELAY));
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
                        }, DesktopLoadService.AUTH_RETRY_DELAY);
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

