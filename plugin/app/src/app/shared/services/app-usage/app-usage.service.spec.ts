import { TestBed } from "@angular/core/testing";

import { AppUsageService } from "./app-usage.service";
import { AppUsageDao } from "../../dao/app-usage/app-usage.dao";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";

describe("AppUsageService", () => {

	let appUsageService: AppUsageService = null;

	let appUsageDao: AppUsageDao = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AppUsageService, AppUsageDao]
		});
		// Retrieve injected service
		appUsageService = TestBed.get(AppUsageService);
		appUsageDao = TestBed.get(AppUsageDao);
	});

	it("should be created", (done: Function) => {
		expect(appUsageService).toBeTruthy();
		done();
	});

	it("should provide AppUsageDetails", (done: Function) => {

		// Given
		const quotaBytes = 1024;
		const bytesInUse = 512;
		const appUsage = new AppUsage(bytesInUse, quotaBytes);
		spyOn(appUsageDao, "get").and.returnValue(Promise.resolve(appUsage));

		const expectedAppUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage,
			bytesInUse / (1024 * 1024),
			bytesInUse / quotaBytes * 100);

		// When
		const promise: Promise<AppUsageDetails> = appUsageService.get();

		// Then
		promise.then((result: AppUsageDetails) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedAppUsageDetails);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
