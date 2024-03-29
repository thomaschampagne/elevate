import { Inject, Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { ActivityService } from "../../activity/activity.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AppRoutes } from "../../../models/app-routes";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

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

  public openLink(path: string): Promise<void> {
    if (path.startsWith("http")) {
      return this.electronService.openExternalUrl(path);
    }

    return this.electronService.existsSync(path).then(exists => {
      if (exists) {
        return this.electronService.openItem(path).then(() => Promise.resolve());
      } else {
        return Promise.reject(`Path to file "${path}" do not exists`);
      }
    });
  }

  public openActivity(id: number | string): Promise<boolean> {
    return this.router.navigate([`${AppRoutes.activity}/${id}`]);
  }

  public openSourceActivity(id: number | string, sourceType: ConnectorType): void {
    this.activityService.getById(id).then(activity => {
      if (activity) {
        if (sourceType === ConnectorType.STRAVA && activity.extras?.strava.activityId > 0) {
          this.openStravaActivity(activity.extras.strava.activityId);
        } else if (sourceType === ConnectorType.FILE && activity.extras?.file?.path) {
          const itemPath = activity.extras.file.path;
          try {
            this.showItemInFolder(itemPath).catch(() =>
              this.snackBar.open(`Unable to open "${itemPath}" file.`, "Close")
            );
          } catch (err) {
            this.snackBar.open(`Activity file "${itemPath}" don't exists.`, "Close");
          }
        } else {
          this.snackBar.open(`Unable to open activity.`, "Close");
        }
      } else {
        this.snackBar.open(`Activity with id ${id} not found`, "Close");
      }
    });
  }

  public showItemInFolder(itemPath: string): Promise<void> {
    return this.electronService.showItemInFolder(itemPath);
  }
}
