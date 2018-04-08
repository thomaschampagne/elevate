export class ActivityBasicInfoModel {
	public activityName: string;
	public activityTime: string;
	public segmentEffort?: {
		name: string;
		elapsedTimeSec: number;
	};
}
