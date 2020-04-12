import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { AthleteSnapshotResolverService } from "../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { Subject } from "rxjs";
import { LoggerService } from "../logging/logger.service";
import FindRequest = PouchDB.Find.FindRequest;

export abstract class ActivityService {

    public athleteSettingsConsistency: Subject<boolean>;
    public activitiesWithSettingsLacks: Subject<boolean>;

    protected constructor(public activityDao: ActivityDao,
                          public athleteSnapshotResolverService: AthleteSnapshotResolverService,
                          public logger: LoggerService) {
        this.athleteSettingsConsistency = new Subject<boolean>();
        this.activitiesWithSettingsLacks = new Subject<boolean>();
    }

    public fetch(): Promise<SyncedActivityModel[]> {
        return (<Promise<SyncedActivityModel[]>> this.activityDao.fetch()).then(activities => {
            return Promise.resolve(_.sortBy<SyncedActivityModel>(activities, "start_time"));
        });
    }

    public getById(id: number | string): Promise<SyncedActivityModel> {
        return this.activityDao.getById(<string> id);
    }

    public find(findRequest: PouchDB.Find.FindRequest<SyncedActivityModel[]>): Promise<SyncedActivityModel[]> {
        return (<Promise<SyncedActivityModel[]>> this.activityDao.find(findRequest)).then(activities => {
            return Promise.resolve(_.sortBy<SyncedActivityModel>(activities, "start_time"));
        });
    }

    public save(syncedActivityModels: SyncedActivityModel[]): Promise<SyncedActivityModel[]> {
        return (<Promise<SyncedActivityModel[]>> this.activityDao.save(syncedActivityModels));
    }

    public put(syncedActivityModel: SyncedActivityModel): Promise<SyncedActivityModel> {
        return (<Promise<SyncedActivityModel>> this.activityDao.put(syncedActivityModel));
    }

    public clear(): Promise<void> {
        return this.activityDao.clear();
    }

    public findByDatedSession(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {

        const activityStartTime = new Date(startTime).toISOString();
        const endDate = new Date(activityStartTime);
        endDate.setSeconds(endDate.getSeconds() + activityDurationSeconds);
        const activityEndTime = endDate.toISOString();

        const query: FindRequest<SyncedActivityModel[]> = {
            selector: {
                $or: [
                    {
                        start_time: {
                            $gte: activityStartTime,
                        },
                        end_time: {
                            $lte: activityEndTime,
                        }
                    },
                    {
                        start_time: {
                            $gte: activityStartTime,
                            $lte: activityEndTime,
                        }
                    },
                    {
                        end_time: {
                            $gte: activityStartTime,
                            $lte: activityEndTime,
                        }
                    }

                ]

            }
        };

        return this.find(query);
    }

    public removeByIds(activitiesToDelete: (string | number)[]): Promise<SyncedActivityModel[]> {
        return this.activityDao.removeByIds(activitiesToDelete);
    }

    /**
     * Tells if local synced activities is compliant with current athlete settings
     */
    public isAthleteSettingsConsistent(): Promise<boolean> {

        return this.athleteSnapshotResolverService.update().then(() => {
            return this.activityDao.fetch();
        }).then((syncedActivityModels: SyncedActivityModel[]) => {
            let isCompliant = true;
            _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
                const athleteModelFound = this.athleteSnapshotResolverService.resolve(new Date(syncedActivityModel.start_time));
                if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
                    isCompliant = false;
                    return false;
                }
            });
            return Promise.resolve(isCompliant);
        });
    }

    /**
     * Ask for athleteSettings consistency check and notify athleteSettingsConsistency subscribers of consistency
     */
    public verifyConsistencyWithAthleteSettings(): void {

        this.logger.debug("checking athlete settings consistency");
        this.isAthleteSettingsConsistent().then(isConsistent => {
            this.athleteSettingsConsistency.next(isConsistent);
            this.logger.debug("Athlete settings consistent: " + isConsistent);
        }, error => this.athleteSettingsConsistency.error(error));

    }


    /**
     * Provide local synced activity ids which are not compliant with current athlete settings
     */
    public nonConsistentActivitiesWithAthleteSettings(): Promise<number[]> {

        return this.athleteSnapshotResolverService.update().then(() => {
            return this.fetch();
        }).then((syncedActivityModels: SyncedActivityModel[]) => {
            const nonConsistentIds = [];
            _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
                const athleteModelFound = this.athleteSnapshotResolverService.resolve(new Date(syncedActivityModel.start_time));
                if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
                    nonConsistentIds.push(syncedActivityModel.id);
                }
            });
            return Promise.resolve(nonConsistentIds);
        });

    }

    /**
     * Ask to check activities having settings lacks (missing FTPs)
     */
    public verifyActivitiesWithSettingsLacking(): void {
        this.logger.debug("checking activities with settings lacks");
        this.hasActivitiesWithSettingsLacks().then(hasSettingsLack => {
            this.activitiesWithSettingsLacks.next(hasSettingsLack);
            this.logger.debug("Activities with settings lacks: " + hasSettingsLack);
        }, error => this.activitiesWithSettingsLacks.error(error));
    }

    public hasActivitiesWithSettingsLacks(): Promise<boolean> {
        return this.activityDao.fetch().then((syncedActivityModels: SyncedActivityModel[]) => { // TODO Improve using mango query
            const hasSettingsLack = !!_.find<SyncedActivityModel>(syncedActivityModels, {settingsLack: true});
            return Promise.resolve(hasSettingsLack);
        });
    }

    public findActivitiesWithSettingsLacks(): Promise<SyncedActivityModel[]> {
        return this.activityDao.fetch().then((syncedActivityModels: SyncedActivityModel[]) => { // TODO Improve using mango query
            const filtered = _.filter<SyncedActivityModel>(syncedActivityModels, {settingsLack: true});
            return Promise.resolve(filtered);
        });
    }
}

