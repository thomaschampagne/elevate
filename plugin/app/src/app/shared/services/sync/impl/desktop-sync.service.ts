import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { ElectronService } from "../../electron/electron.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subject, Subscription } from "rxjs";
import { StravaConnector, SyncEvent } from "@elevate/shared/sync";

@Injectable()
export class DesktopSyncService extends SyncService implements OnDestroy {

	public syncSubscription: Subscription;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public logger: LoggerService,
				public electronService: ElectronService) {
		super(versionsProvider, lastSyncDateTimeDao, activityDao, athleteService, userSettingsService, logger);

		this.syncSubscription = null;
	}

	public sync(fastSync: boolean, forceSync: boolean): Subject<SyncEvent> {

		const stravaConnector = new StravaConnector(null, null, null, null, null);

		/*		const connectors = [
					stravaConnector,
					// new FileSystemConnector(null, null, null, null)
				];*/

		if (this.syncSubscription) {
			// TODO Handle cancel current sync => restart new sync!
			this.syncSubscription.unsubscribe();
		}

		this.syncSubscription = this.electronService.sync(fastSync, forceSync, stravaConnector).subscribe((stravaSyncEvent: SyncEvent) => {
			this.logger.info(stravaSyncEvent);
		});

		return null; // TODO return Subject !
	}

	public ngOnDestroy(): void {
		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}
	}
}
