import { Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { ElectronService } from "../../electron/electron.service";
import { ActivityService } from "../../activity/activity.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConnectorType } from "@elevate/shared/sync";
import { SyncedActivityModel } from "@elevate/shared/models";
import { Router } from "@angular/router";
import { AppRoutesModel } from "../../../models/app-routes.model";

@Injectable()
export class DesktopOpenResourceResolver extends OpenResourceResolver {

	constructor(public electronService: ElectronService,
				public activityService: ActivityService,
				public router: Router,
				public snackBar: MatSnackBar) {
		super(snackBar);
	}

	public openActivity(id: number | string): void {
		this.activityService.getById(<string> id).then(activity => {
			if (activity) {
				switch (activity.sourceConnectorType) {
					case ConnectorType.STRAVA:
						this.openStravaActivity(activity);
						break;
					default:
						this.router.navigate([AppRoutesModel.activityView, activity.id]);
						break;
				}
			} else {
				this.snackBar.open(`Activity with id ${id} not found`, "Close");
			}
		});
	}

	public openWebLink(url: string): void {
		this.electronService.openExternalUrl(url);
	}

	private openStravaActivity(activity: SyncedActivityModel): void {
		this.openWebLink("https://www.strava.com/activities/" + activity.extras.strava_activity_id);
	}

}
