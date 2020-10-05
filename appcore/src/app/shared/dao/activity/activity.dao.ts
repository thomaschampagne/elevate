import { Injectable } from "@angular/core";
import { SyncedActivityModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";

@Injectable()
export class ActivityDao extends BaseDao<SyncedActivityModel> {

    public static readonly COLLECTION_DEF = new CollectionDef("syncedActivities", {
        unique: ["id"],
        indices: ["name", "start_time", "type"]
    });

    public getCollectionDef(): CollectionDef<SyncedActivityModel> {
        return ActivityDao.COLLECTION_DEF;
    }

    public getDefaultStorageValue(): SyncedActivityModel[] {
        return [];
    }

    public findByDatedSession(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {

        const activityStartTime = new Date(startTime).toISOString();
        const endDate = new Date(activityStartTime);
        endDate.setSeconds(endDate.getSeconds() + activityDurationSeconds);
        const activityEndTime = endDate.toISOString();

        return this.find({
            start_time: {
                $lt: activityEndTime
            },
            end_time: {
                $gt: activityStartTime
            }
        });
    }

    public findSortStartDate(descending: boolean): Promise<SyncedActivityModel[]> {
        const sort: { propName: keyof SyncedActivityModel, options: Partial<SimplesortOptions> } = {
            propName: "start_time",
            options: {desc: descending}
        };
        return this.find(null, sort);
    }

    public hasActivitiesWithSettingsLacks(): Promise<boolean> {
        return this.count({settingsLack: true}).then(count => {
            return Promise.resolve(count > 0);
        });
    }

    public findActivitiesWithSettingsLacks(): Promise<SyncedActivityModel[]> {
        return this.find({settingsLack: true});
    }
}
