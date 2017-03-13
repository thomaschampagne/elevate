interface ISyncRawStravaActivity {

    id: number;
    name: string;
    type: string;
    display_type: string;
    activity_type_display_name: string;
    private: boolean;
    bike_id: number;
    athlete_gear_id: number;
    start_date: string;
    start_date_local_raw: number;
    start_time: string;
    start_day: string;
    distance: string;
    distance_raw: number;
    long_unit: string;
    short_unit: string;
    moving_time: string;
    moving_time_raw: number;
    elapsed_time: string;
    elapsed_time_raw: number;
    trainer: boolean;
    static_map: boolean;
    show_elevation: boolean;
    has_latlng: boolean;
    commute: boolean;
    elevation_gain: string;
    elevation_unit: string;
    elevation_gain_raw: number;
    description: string;
    is_new: boolean;
    is_changing_type: boolean;
    suffer_score: number;
    calories: number;
    feed_data: any;
    workout_type: string;
    flagged: boolean;
    hide_power: boolean;
    hide_heartrate: boolean;
}

interface ISyncActivityWithStream extends ISyncRawStravaActivity {
    stream: any;
    hasPowerMeter: boolean;
}

interface ISyncActivityComputed {
    id: number;
    name: string;
    type: string;
    display_type: string;
    private: boolean;
    bike_id: number;
    start_time: string;
    distance_raw: number;
    short_unit: string;
    moving_time_raw: number;
    elapsed_time_raw: number;
    trainer: boolean;
    commute: boolean;
    elevation_unit: string;
    elevation_gain_raw: number;
    calories: number;
    extendedStats: IAnalysisData;
}

interface ISyncNotify {
    step?: string;
    progress?: number;
    index?: number;
    activityId?: number;
    fromPage?: number;
    toPage?: number;
    pageGroupId?: number;
    browsedActivitiesCount?: number;
    totalActivities?: number;
}