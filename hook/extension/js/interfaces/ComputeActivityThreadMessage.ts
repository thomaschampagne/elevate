interface ComputeActivityThreadMessage {
    activityType: string;
    isTrainer: boolean;
    appResources: AppResources;
    userSettings: UserSettings;
    athleteWeight: number;
    hasPowerMeter: boolean;
    activityStatsMap: ActivityStatsMap;
    activityStream: ActivityStream;
    bounds: Array<number>;
}