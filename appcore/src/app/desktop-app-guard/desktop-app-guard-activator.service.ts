import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { MatDialog } from "@angular/material";
import { DesktopAppGuardDialogComponent } from "./desktop-app-guard-dialog.component";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { IpcRendererMessagesService } from "../shared/services/messages-listener/ipc-renderer-messages.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { concatMap, delay, retryWhen } from "rxjs/operators";
import { of, throwError } from "rxjs";
import { MachineAuthenticator } from "./machine-authenticator";
import * as HttpCodes from "http-status-codes";
import { LoggerService } from "../shared/services/logging/logger.service";
import { DistributedEndpointsResolver } from "@elevate/shared/resolvers";


@Injectable()
export class DesktopAppGuardActivator implements CanActivate {

	private static readonly AUTH_RETRY_COUNT = 1;
	private static readonly AUTH_RETRY_DELAY = 1000;

	public machineId: string;
	public isMachineAuthorized: boolean;

	constructor(public httpClient: HttpClient,
				public ipcRendererMessagesService: IpcRendererMessagesService,
				public router: Router,
				public dialog: MatDialog,
				public logger: LoggerService) {
		this.machineId = null;
		this.isMachineAuthorized = false;
	}

	private static AUTH_MACHINE_API_URL(machineId: string) {
		const currentBaseEndPoint = `${DistributedEndpointsResolver.resolve("https://elevate-concept-${id}.herokuapp.com")}`;
		return `${currentBaseEndPoint}/api/machine/auth/${machineId}`;
	}

	public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

		if (this.isMachineAuthorized) {
			return Promise.resolve(true);
		}

		return this.getMachineId().then(machineId => {
			this.machineId = machineId;
			return this.checkIfMachineIsAuthorized(this.machineId);
		}).then(machineAuthorized => {

			this.isMachineAuthorized = machineAuthorized;

			if (!machineAuthorized) {
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
					data: this.machineId
				});
			}

			return Promise.resolve(machineAuthorized);
		});
	}

	public getMachineId(): Promise<string> {
		return this.ipcRendererMessagesService.send<string>(new FlaggedIpcMessage(MessageFlag.GET_MACHINE_ID));
	}

	public checkIfMachineIsAuthorized(machineId: string, authRetry: boolean = false): Promise<boolean> {

		return new Promise<boolean>(((resolve, reject) => {
			this.httpClient.get(DesktopAppGuardActivator.AUTH_MACHINE_API_URL(machineId), {responseType: "text"}).pipe(
				retryWhen(errors => errors.pipe(concatMap((error: HttpErrorResponse, tryIndex: number) => {
					if (error.status === HttpCodes.UNAUTHORIZED) {
						return throwError(error);
					}
					return ((tryIndex + 1) > DesktopAppGuardActivator.AUTH_RETRY_COUNT)
						? throwError(error) : of(error).pipe(delay(DesktopAppGuardActivator.AUTH_RETRY_DELAY));
				})))
			).subscribe(authCode => {
				const authenticated = this.authMachine(this.machineId, authCode);

				if (authenticated) {
					resolve(authenticated);
				} else if (authRetry) {
					resolve(authenticated);
				} else {
					setTimeout(() => {
						this.logger.info("Retry machine authentication");
						this.checkIfMachineIsAuthorized(machineId, true).then(isAuthenticated => {
							resolve(isAuthenticated);
						});
					}, DesktopAppGuardActivator.AUTH_RETRY_DELAY);
				}
			}, error => {
				resolve(false);
			});

		}));
	}

	public authMachine(machineId: string, remoteAuthCode: string): boolean {
		return MachineAuthenticator.auth(machineId, remoteAuthCode);
	}
}

