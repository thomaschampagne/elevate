export class ActivityInfoModel { // TODO Merge with ActivitySourceDataModel?!
	public id: number;
	public type: string;
	public name: string;
	public startTime: Date;
	public isTrainer: boolean;
	public supportsGap: boolean;
	public isOwner: boolean;
	public segmentEffort?: {
		name: string;
		elapsedTimeSec: number;
	};
}
