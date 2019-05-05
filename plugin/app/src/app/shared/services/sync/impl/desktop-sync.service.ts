import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subscription } from "rxjs";
import { ConnectorType, StravaApiCredentials, SyncEvent } from "@elevate/shared/sync";
import { IpcRendererMessagesService } from "../../messages-listener/ipc-renderer-messages.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { StravaApiCredentialsService } from "../../strava-api-credentials/strava-api-credentials.service";

// TODO Handle cancel current sync => restart new sync!
// TODO Handle priority
// TODO Handle updateSyncedActivitiesNameAndType of strava over filesystem connector
// TODO Handle no strava access token (or expired) when starting strava sync

@Injectable()
export class DesktopSyncService extends SyncService implements OnDestroy {

	public syncSubscription: Subscription;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public messageListenerService: IpcRendererMessagesService,
				public stravaApiCredentialsService: StravaApiCredentialsService,
				public logger: LoggerService) {
		super(versionsProvider, lastSyncDateTimeDao, activityDao, athleteService, userSettingsService, logger);

		this.syncSubscription = null;
	}

	public sync(fastSync: boolean, forceSync: boolean): void {

		// Let's sync strava connector
		this.stravaApiCredentialsService.fetch().then((stravaApiCredentials: StravaApiCredentials) => {

			if (this.syncSubscription) {
				this.syncSubscription.unsubscribe();
			}

			// Subscribe for sync events
			this.syncSubscription = this.messageListenerService.syncEvents.subscribe((stravaSyncEvent: SyncEvent) => {
				this.logger.info(stravaSyncEvent);
			});

			// Create message to start sync on connector!
			const updateSyncedActivitiesNameAndType = true;
			const startSyncMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			this.messageListenerService.send<string>(startSyncMessage).then((response: string) => {
				this.logger.info("Message received by ipcMain. Response:", response);
			});

		}, error => {
			throw error;
		});

	}

	public ngOnDestroy(): void {
		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}
	}
}
