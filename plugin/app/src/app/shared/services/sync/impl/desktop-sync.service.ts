import { Inject, Injectable } from "@angular/core";
import { SyncService } from "../sync.service";
import { ElectronService } from "../../electron/electron.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class DesktopSyncService extends SyncService {

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public logger: LoggerService,
				public electronService: ElectronService) {
		super(versionsProvider, lastSyncDateTimeDao, activityDao, athleteService, userSettingsService, logger);
	}

	public sync(fastSync: boolean, forceSync: boolean): void {
	}
}
