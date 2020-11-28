import { Inject, Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { ActivityService } from "../../activity/activity.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { ConnectorType } from "@elevate/shared/sync";
import { ElevateException } from "@elevate/shared/exceptions";

@Injectable()
export class DesktopOpenResourceResolver extends OpenResourceResolver {
  constructor(
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {
    super(snackBar);
  }

  public openLink(path: string): void {
    // Check if not a web url and verify file exists on file system
    if (!path.startsWith("http") && !this.electronService.existsSync(path)) {
      this.snackBar.open(`Path to file "${path}" do not exists`, "Close");
      return;
    }

    this.electronService.openExternalUrl(path);
  }

  public openActivity(id: number | string): void {
    this.activityService.getById(id).then(activity => {
      if (activity) {
        // Implements activity opening here
      } else {
        this.snackBar.open(`Activity with id ${id} not found`, "Close");
      }
    });
  }

  public openSourceActivity(id: number | string): void {
    this.activityService.getById(id).then(activity => {
      if (activity) {
        switch (activity.sourceConnectorType) {
          case ConnectorType.STRAVA:
            this.openLink("https://www.strava.com/activities/" + activity.extras.strava_activity_id);
            break;
          case ConnectorType.FILE:
            this.openLink(activity.extras.fs_activity_location.path);
            break;
          default:
            throw new ElevateException(`Source connector type ${activity.sourceConnectorType} unknown.`);
        }
      } else {
        this.snackBar.open(`Activity with id ${id} not found`, "Close");
      }
    });
  }
}
