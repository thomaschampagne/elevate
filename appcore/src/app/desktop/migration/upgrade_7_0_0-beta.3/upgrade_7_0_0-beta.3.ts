import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import _ from "lodash";

export class Upgrade_7_0_0$beta_3 extends DesktopMigration {
  public version: string = "7.0.0-beta.3";

  public description: string = "Fix avg/max speeds/paces on intervals when imported from Strava";

  public requiresRecalculation: boolean = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    const activitiesCollection = db.getCollection("activities");
    if (activitiesCollection) {
      const activitiesFromStrava = activitiesCollection.find({ connector: "STRAVA" });
      if (activitiesFromStrava?.length) {
        activitiesFromStrava.forEach((activity: Activity) => {
          if (activity.laps?.length) {
            activity.laps = activity.laps.map(lap => {
              lap.avgSpeed = lap.avgSpeed >= 0 ? _.round(lap.avgSpeed * 3.6, 3) : null;
              lap.avgPace = Number.isFinite(lap.avgSpeed) && lap.avgSpeed > 0 ? _.round(3600 / lap.avgSpeed) : null;

              lap.maxSpeed = lap.maxSpeed >= 0 ? _.round(lap.maxSpeed * 3.6, 3) : null;
              lap.maxPace = Number.isFinite(lap.maxSpeed) && lap.maxSpeed > 0 ? _.round(3600 / lap.maxSpeed) : null;

              return lap;
            });
            activitiesCollection.update(activity);
          }
        });
      }
    }
    return this.saveDatabase(db);
  }
}
