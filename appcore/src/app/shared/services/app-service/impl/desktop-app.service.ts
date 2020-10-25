import { Inject, Injectable } from "@angular/core";
import { AppService } from "../app.service";
import { ActivityService } from "../../activity/activity.service";
import { DesktopSyncService } from "../../sync/impl/desktop-sync.service";
import { SyncService } from "../../sync/sync.service";

@Injectable()
export class DesktopAppService extends AppService {
  constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(SyncService) public readonly desktopSyncService: DesktopSyncService
  ) {
    super(activityService, desktopSyncService);
  }
}
