export class CompressedStreamModel {

	public static readonly ID_FIELD: string = "activityId";

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
