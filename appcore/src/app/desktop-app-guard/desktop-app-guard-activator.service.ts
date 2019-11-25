import { Inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { MatDialog } from "@angular/material";
import { DesktopAppGuardDialogComponent } from "./desktop-app-guard-dialog.component";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { IpcRendererMessagesService } from "../shared/services/messages-listener/ipc-renderer-messages.service";
import { FlaggedIpcMessage, MessageFlag, RuntimeInfo } from "@elevate/shared/electron";
import { concatMap, delay, retryWhen } from "rxjs/operators";
import { of, throwError } from "rxjs";
import { AthleteAccessChecker } from "./athlete-access-checker";
import * as HttpCodes from "http-status-codes";
import { LoggerService } from "../shared/services/logging/logger.service";
import { DistributedEndpointsResolver } from "@elevate/shared/resolvers";
import { environment } from "../../environments/environment.desktop";
import { StravaApiCredentialsService } from "../shared/services/strava-api-credentials/strava-api-credentials.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../shared/services/versions/versions-provider.interface";
import { StravaApiCredentials } from "@elevate/shared/sync";

@Injectable()
export class DesktopAppGuardActivator implements CanActivate {

	private static readonly AUTH_RETRY_COUNT = 1;
	private static readonly AUTH_RETRY_DELAY = 1000;

	public runtimeInfo: RuntimeInfo;
	public isAccessAuthorized: boolean;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public ipcRendererMessagesService: IpcRendererMessagesService,
				public stravaApiCredentialsService: StravaApiCredentialsService,
				public httpClient: HttpClient,
				public router: Router,
				public dialog: MatDialog,
				public logger: LoggerService) {
		this.runtimeInfo = null;
		this.isAccessAuthorized = false;
	}

	private static ATHLETE_ACCESS_API_URL() {
		const currentBaseEndPoint = `${DistributedEndpointsResolver.resolve("https://elevate-prototype-${id}.herokuapp.com")}`;
		return `${currentBaseEndPoint}/api/athlete/access`;
	}

	public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

		if (this.isAccessAuthorized || environment.bypassAthleteAccessCheck) {
			return Promise.resolve(true);
		}

		return this.getRuntimeInfo().then(runtimeInfo => {
			this.runtimeInfo = runtimeInfo;
			return this.checkAthleteAccess(this.runtimeInfo);
		}).then(accessAuthorized => {

			this.isAccessAuthorized = accessAuthorized;

			if (!accessAuthorized) {
				this.dialog.open(DesktopAppGuardDialogComponent, {
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
		});
	}

	public getRuntimeInfo(): Promise<RuntimeInfo> {
		return this.ipcRendererMessagesService.send<RuntimeInfo>(new FlaggedIpcMessage(MessageFlag.GET_RUNTIME_INFO));
	}

	public checkAthleteAccess(runtimeInfo: RuntimeInfo, authRetry: boolean = false): Promise<boolean> {

		return Promise.all([
			this.versionsProvider.getInstalledAppVersion(),
			this.stravaApiCredentialsService.fetch()
		]).then(result => {

			const installedVersion = result[0];
			const stravaApiCredentials: StravaApiCredentials = result[1];

			return new Promise<boolean>((resolve => {

				const athleteAccessBodyData = {
					athleteMachineId: this.runtimeInfo.athleteMachineId,
					version: installedVersion,
					osPlatform: this.runtimeInfo.osPlatform,
					osUsername: this.runtimeInfo.osUsername,
					memorySizeGb: this.runtimeInfo.memorySizeGb,
					cpu: this.runtimeInfo.cpu,
					stravaAccount: (stravaApiCredentials.stravaAccount) ? stravaApiCredentials.stravaAccount : null
				};

				this.httpClient.post(DesktopAppGuardActivator.ATHLETE_ACCESS_API_URL(), athleteAccessBodyData, {responseType: "text"}).pipe(
					retryWhen(errors => errors.pipe(concatMap((error: HttpErrorResponse, tryIndex: number) => {
						if (error.status === HttpCodes.UNAUTHORIZED) {
							return throwError(error);
						}
						return ((tryIndex + 1) > DesktopAppGuardActivator.AUTH_RETRY_COUNT)
							? throwError(error) : of(error).pipe(delay(DesktopAppGuardActivator.AUTH_RETRY_DELAY));
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
						}, DesktopAppGuardActivator.AUTH_RETRY_DELAY);
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

