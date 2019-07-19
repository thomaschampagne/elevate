import { Injectable } from "@angular/core";
import { IpcRendererMessagesService } from "../../shared/services/messages-listener/ipc-renderer-messages.service";
import { ConnectorType, StravaApiCredentials, StravaCredentialsUpdateSyncEvent, SyncEventType } from "@elevate/shared/sync";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { SyncService } from "../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { StravaApiCredentialsService } from "../../shared/services/strava-api-credentials/strava-api-credentials.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { filter } from "rxjs/operators";

@Injectable()
export class StravaConnectorService {

	public stravaApiCredentials: StravaApiCredentials;
	public stravaApiCredentials$: Subject<StravaApiCredentials>;

	constructor(public stravaApiCredentialsService: StravaApiCredentialsService,
				public messagesListenerService: IpcRendererMessagesService,
				public syncService: SyncService,
				public logger: LoggerService) {

		this.stravaApiCredentials$ = new Subject<StravaApiCredentials>();
	}

	public fetchCredentials(): Promise<StravaApiCredentials> {
		return this.stravaApiCredentialsService.fetch();
	}

	/**
	 * Promise updated StravaApiCredentials with proper access & refresh token
	 */
	public authenticate(): Promise<StravaApiCredentials> {

		return this.fetchCredentials().then((stravaApiCredentials: StravaApiCredentials) => {

			this.stravaApiCredentials = stravaApiCredentials;

			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.LINK_STRAVA_CONNECTOR, this.stravaApiCredentials.clientId,
				this.stravaApiCredentials.clientSecret, this.stravaApiCredentials.refreshToken);

			return this.messagesListenerService.send<{ accessToken: string, refreshToken: string, expiresAt: number }>(flaggedIpcMessage);

		}).then(result => {

			this.stravaApiCredentials.accessToken = result.accessToken;
			this.stravaApiCredentials.refreshToken = result.refreshToken;
			this.stravaApiCredentials.expiresAt = result.expiresAt;
			return this.stravaApiCredentialsService.save(this.stravaApiCredentials);

		}).then((stravaApiCredentials: StravaApiCredentials) => {

			return Promise.resolve(stravaApiCredentials);

		}).catch(error => {
			return Promise.reject(error);
		});
	}

	/**
	 *
	 */
	public sync(fastSync: boolean, forceSync: boolean): Promise<void> {

		const desktopSyncService = <DesktopSyncService> this.syncService;

		// Subscribe to listen for StravaCredentialsUpdate (case where refresh token is performed)
		desktopSyncService.syncEvents$.pipe(
			filter(syncEvent => (syncEvent.type === SyncEventType.STRAVA_CREDENTIALS_UPDATE))
		).subscribe((stravaCredentialsUpdateSyncEvent: StravaCredentialsUpdateSyncEvent) => {
			this.stravaApiCredentialsService.save(stravaCredentialsUpdateSyncEvent.stravaApiCredentials)
				.then((stravaApiCredentials: StravaApiCredentials) => {
					this.stravaApiCredentials$.next(stravaApiCredentials);
				});
		});

		return desktopSyncService.sync(fastSync, forceSync, ConnectorType.STRAVA);

		// const syncEventSubject$ = (<DesktopSyncService> this.syncService).sync2(fastSync, forceSync, ConnectorType.STRAVA);

		/*const syncEventSubject$ = (<DesktopSyncService> this.syncService).sync(fastSync, forceSync, ConnectorType.STRAVA);

		// Listen for StravaApiCredentials updates then store them & notify subscribers
		syncEventSubject$.pipe(
			filter(syncEvent => (syncEvent.type === SyncEventType.GENERIC && (<any> syncEvent).stravaApiCredentials))
		).subscribe((stravaCredentialsUpdateSyncEvent: StravaCredentialsUpdateSyncEvent) => {
			this.stravaApiCredentialsService.save(stravaCredentialsUpdateSyncEvent.stravaApiCredentials)
				.then((stravaApiCredentials: StravaApiCredentials) => {
					this.stravaApiCredentials$.next(stravaApiCredentials);
				});
		});

		/!*
		Sample for catching error only and snack them:

		syncEventSubject$.pipe(
			filter(syncEvent => syncEvent.type === SyncEventType.ERROR)
		).subscribe((errorSyncEvent: ErrorSyncEvent) => {
			this.snackBar.open("Whoops! " + errorSyncEvent.description, "Close");
		});*!/

		return syncEventSubject$;*/
	}

	/*public stop(): Promise<void> {
		return (<DesktopSyncService> this.syncService).stop(ConnectorType.STRAVA).then(() => {
			// this.snackBar.open("Sync cancelled", "Close");
			return Promise.resolve();
		}, error => {
			this.logger.error(error);
			throw new Error(error); // Should be caught by Error Handler
		});
	}*/

}
