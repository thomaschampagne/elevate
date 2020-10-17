import { Inject, Injectable } from "@angular/core";
import { ActivityService } from "../activity.service";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteSnapshotResolverService } from "../../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class ExtensionActivityService extends ActivityService {
  constructor(
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(AthleteSnapshotResolverService) public readonly athleteSnapshotResolver: AthleteSnapshotResolverService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(activityDao, athleteSnapshotResolver, logger);
  }
}
