interface IComputeActivityThreadMessage {
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
}