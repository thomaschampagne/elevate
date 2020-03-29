import { Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { ElectronService } from "../../electron/electron.service";
import { ActivityService } from "../../activity/activity.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConnectorType } from "@elevate/shared/sync";
import { Router } from "@angular/router";
import { AppRoutesModel } from "../../../models/app-routes.model";
import { ElevateException } from "@elevate/shared/exceptions";

@Injectable()
export class DesktopOpenResourceResolver extends OpenResourceResolver {

	constructor(public electronService: ElectronService,
				public activityService: ActivityService,
				public router: Router,
				public snackBar: MatSnackBar) {
		super(snackBar);
	}

	public openLink(url: string): void {
		this.electronService.openExternalUrl(url);
	}

	public openActivity(id: number | string): void {
		this.activityService.getById(<string> id).then(activity => {
			if (activity) {
				this.router.navigate([AppRoutesModel.activityView, activity.id]);
			} else {
				this.snackBar.open(`Activity with id ${id} not found`, "Close");
			}
		});
	}

	public openSourceActivity(id: number | string): void {
		this.activityService.getById(<string> id).then(activity => {
			if (activity) {
				switch (activity.sourceConnectorType) {
					case ConnectorType.STRAVA:
						this.openLink("https://www.strava.com/activities/" + activity.extras.strava_activity_id);
						break;
					case ConnectorType.FILE_SYSTEM:
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
