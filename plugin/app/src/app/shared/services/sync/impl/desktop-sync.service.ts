import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subscription } from "rxjs";
import { StravaConnector, SyncEvent } from "@elevate/shared/sync";
import { IpcRendererMessagesService } from "../../messages-listener/ipc-renderer-messages.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";

// TODO Handle cancel current sync => restart new sync!

@Injectable()
export class DesktopSyncService extends SyncService implements OnDestroy {

	public syncSubscription: Subscription;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public messageListenerService: IpcRendererMessagesService,
				public logger: LoggerService) {
		super(versionsProvider, lastSyncDateTimeDao, activityDao, athleteService, userSettingsService, logger);

		this.syncSubscription = null;
	}

	public sync(fastSync: boolean, forceSync: boolean): void {

		// Let's sync strava connector
		const stravaConnector = new StravaConnector(null, null, null, null, null);

		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}

		// Subscribe for sync events
		this.syncSubscription = this.messageListenerService.syncEvents.subscribe((stravaSyncEvent: SyncEvent) => {
			this.logger.info(stravaSyncEvent);
		});

		// Create message to start sync on connector!
		const startSyncMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, stravaConnector);
		this.messageListenerService.send<string>(startSyncMessage).then((response: string) => {
			this.logger.info("Message received by ipcMain. Response:", response);
		});
	}

	public ngOnDestroy(): void {
		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}
	}
}
