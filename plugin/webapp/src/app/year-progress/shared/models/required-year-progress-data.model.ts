import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";

export class RequiredYearProgressDataModel {

	public isMetric: boolean;
	public syncedActivityModels: SyncedActivityModel[];

	constructor(isMetric?: boolean, syncedActivityModels?: SyncedActivityModel[]) {
		this.isMetric = (isMetric) ? isMetric : null;
		this.syncedActivityModels = (syncedActivityModels) ? syncedActivityModels : null;
	}
}
