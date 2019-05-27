import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subscription } from "rxjs";
import { ActivitySyncEvent, ConnectorType, StravaApiCredentials, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { IpcRendererMessagesService } from "../../messages-listener/ipc-renderer-messages.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { StravaApiCredentialsService } from "../../strava-api-credentials/strava-api-credentials.service";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

// TODO Handle cancel current sync => restart new sync!
// TODO Handle priority
// TODO Handle updateSyncedActivitiesNameAndType of strava over filesystem connector
// TODO Handle no strava access token (or expired) when starting strava sync

/*
	TODO Add end_time member on BareActivityModel
	const endDate = new Date(start_time);
	endDate.setSeconds(endDate.getSeconds() + this.duration);
	end_time = endDate.toISOString();
 */

@Injectable()
export class DesktopSyncService extends SyncService implements OnDestroy {

	public syncSubscription: Subscription;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao, // TODO Use ActivityService instead
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public messageListenerService: IpcRendererMessagesService,
				public stravaApiCredentialsService: StravaApiCredentialsService,
				public logger: LoggerService) {
		super(versionsProvider, lastSyncDateTimeDao, activityDao, athleteService, userSettingsService, logger);

		this.syncSubscription = null;
	}

	public sync(fastSync: boolean, forceSync: boolean): void {

		this.messageListenerService.listen();

		// Let's sync strava connector
		Promise.all([
			this.stravaApiCredentialsService.fetch(),
			this.athleteService.fetch(),
			this.userSettingsService.fetch()
		]).then(result => {

			const stravaApiCredentials: StravaApiCredentials = <StravaApiCredentials> result[0];
			const athleteModel: AthleteModel = <AthleteModel> result[1];
			const userSettingsModel: UserSettingsModel = <UserSettingsModel> result[2];

			if (this.syncSubscription) {
				this.syncSubscription.unsubscribe();
			}

			// Subscribe for sync events
			this.syncSubscription = this.messageListenerService.syncEvents.subscribe((stravaSyncEvent: SyncEvent) => {

				// TODO
				switch (stravaSyncEvent.type) {
					case SyncEventType.ACTIVITY:
						this.handleIncomingActivity(<ActivitySyncEvent> stravaSyncEvent);
						break;
					case SyncEventType.GENERIC:
						// TODO ...
						break;
					case SyncEventType.ERROR:
						// TODO ...
						break;
					case SyncEventType.COMPLETE:
						// TODO ...
						break;
					default:
						this.logger.info(stravaSyncEvent.description);
						break;
				}

			}, error => {
				this.logger.error(error);
			});

			// Create message to start sync on connector!
			const updateSyncedActivitiesNameAndType = true;

			// Prepare message for main process
			const startSyncMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA,
				stravaApiCredentials, athleteModel, updateSyncedActivitiesNameAndType, userSettingsModel);

			this.messageListenerService.send<string>(startSyncMessage).then((response: string) => {
				this.logger.info("Message received by ipcMain. Response:", response);
			});

		}, error => {
			throw error;
		});

	}

	public handleIncomingActivity(activitySyncEvent: ActivitySyncEvent): void {

		this.logger.info("Put activity (" + activitySyncEvent.activity.id + ") " + activitySyncEvent.activity.name);

		this.activityDao.put(activitySyncEvent.activity).then(activity => {
			this.logger.info("Activity (" + activity.id + ") " + activity.name + " saved");
		}, error => {
			this.logger.error(error);
		});

	}

	public ngOnDestroy(): void {
		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}
	}
}
