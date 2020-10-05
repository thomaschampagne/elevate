import { Injectable } from "@angular/core";
import { ActivityService } from "../activity.service";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteSnapshotResolverService } from "../../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class ExtensionActivityService extends ActivityService {
    constructor(
        public activityDao: ActivityDao,
        public athleteSnapshotResolverService: AthleteSnapshotResolverService,
        public logger: LoggerService
    ) {
        super(activityDao, athleteSnapshotResolverService, logger);
    }
}
