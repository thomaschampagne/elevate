import { Injectable } from "@angular/core";
import { AppUsageDao } from "../../dao/app-usage/app-usage.dao";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";

@Injectable()
export class AppUsageService {

	constructor(public appUsageDao: AppUsageDao) {
	}

	public get(): Promise<AppUsageDetails> {

		return new Promise<AppUsageDetails>((resolve) => {

			this.appUsageDao.get().then((appUsage: AppUsage) => {

				const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
				const percentUsage = appUsage.bytesInUse / appUsage.quotaBytes * 100;
				const appUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
				resolve(appUsageDetails);

			});

		});
	}
}
