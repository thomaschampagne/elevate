import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

export class YearProgressActivityModel extends SyncedActivityModel {
	public year: number;
	public dayOfYear: number;
}
