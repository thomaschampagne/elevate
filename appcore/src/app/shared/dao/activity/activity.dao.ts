import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { Activity } from "@elevate/shared/models/sync/activity.model";

@Injectable()
export class ActivityDao extends BaseDao<Activity> {
  public static readonly COLLECTION_DEF = new CollectionDef("activities", {
    unique: ["id"],
    indices: ["name", "startTime", "type"]
  });

  public getCollectionDef(): CollectionDef<Activity> {
    return ActivityDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): Activity[] {
    return [];
  }

  public findByDatedSession(startTime: string, endTime: string): Promise<Activity[]> {
    const activityStartTime = new Date(startTime).toISOString();
    const activityEndTime = new Date(endTime).toISOString();

    return this.find({
      startTime: {
        $lt: activityEndTime
      },
      endTime: {
        $gt: activityStartTime
      }
    });
  }

  public findSortStartDate(descending: boolean): Promise<Activity[]> {
    const sort: { propName: keyof Activity; options: Partial<SimplesortOptions> } = {
      propName: "startTime",
      options: { desc: descending }
    };
    return this.find(null, sort);
  }

  public hasActivitiesWithSettingsLacks(): Promise<boolean> {
    return this.count({ settingsLack: true }).then(count => {
      return Promise.resolve(count > 0);
    });
  }

  public findActivitiesWithSettingsLacks(): Promise<Activity[]> {
    return this.find({ settingsLack: true });
  }
}
