import { ElevateSport } from "../../enums";

export class ActivityInfoModel { // TODO Merge with ActivitySourceDataModel?!
    public id: number;
    public type: ElevateSport;
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
