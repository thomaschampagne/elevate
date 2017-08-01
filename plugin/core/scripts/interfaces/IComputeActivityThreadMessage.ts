import {IUserSettings} from "../interfaces/IUserSettings";
import {IActivityStatsMap, IActivityStream} from "./IActivityData";
import {IAppResources} from "./IAppResources";

export interface IComputeActivityThreadMessage {
    activityType: string;
    isTrainer: boolean;
    appResources: IAppResources;
    userSettings: IUserSettings;
    athleteWeight: number;
    hasPowerMeter: boolean;
    activityStatsMap: IActivityStatsMap;
    activityStream: IActivityStream;
    bounds: number[];
    returnZones: boolean;
    systemJsConfig: SystemJSLoader.Config;
}
