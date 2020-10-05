export class CompressedStreamModel {

    public activityId: string;

    /**
     * Compressed ActivityStreamsModel
     */
    public data: string;

    constructor(activityId: string, data: string) {
        this.activityId = activityId;
        this.data = data;
    }
}
