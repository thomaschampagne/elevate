import {IUserSettings} from "../interfaces/IUserSettings";
import {IAppResources} from "./IAppResources";
import {IActivityStatsMap, IActivityStream} from "./IActivityData";

export interface IComputeActivityThreadMessage {
    activityType: string;
    isTrainer: boolean;
    appResources: IAppResources;
    userSettings: IUserSettings;
    athleteWeight: number;
    hasPowerMeter: boolean;
    activityStatsMap: IActivityStatsMap;
    activityStream: IActivityStream;
    bounds: Array<number>;
    returnZones: boolean;
    systemJsConfig: SystemJSLoader.Config;
}