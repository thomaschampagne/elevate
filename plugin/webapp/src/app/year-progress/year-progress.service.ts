import { Injectable } from '@angular/core';
import { YearProgressModel } from "./models/year-progress.model";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";

@Injectable()
export class YearProgressService {

	constructor() {
	}

	public compute(activities: SyncedActivityModel[]): YearProgressModel[] {
		return null;
	}
}
