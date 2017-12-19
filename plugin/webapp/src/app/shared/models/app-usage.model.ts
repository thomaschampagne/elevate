export class AppUsage {

	public bytesInUse: number;
	public quotaBytes: number;

	constructor(bytesInUse: number, quotaBytes: number) {
		this.bytesInUse = bytesInUse;
		this.quotaBytes = quotaBytes;
	}
}
