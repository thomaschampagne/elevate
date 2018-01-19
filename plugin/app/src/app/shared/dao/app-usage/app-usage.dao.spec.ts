import { TestBed } from "@angular/core/testing";

import { AppUsageDao } from "./app-usage.dao";
import { AppUsage } from "../../models/app-usage.model";

describe("AppUsageDao", () => {

	let appUsageDao: AppUsageDao = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [AppUsageDao]
		});

		// Retrieve injected service
		appUsageDao = TestBed.get(AppUsageDao);
	});

	it("should be created", (done: Function) => {
		expect(appUsageDao).toBeTruthy();
		done();
	});

	it("should provide chrome/app local storage usage", (done: Function) => {

		// Given
		const quotaBytes = 1024;
		const bytesInUse = 512;

		spyOn(appUsageDao, "chromeStorageLocal").and.returnValue({
			QUOTA_BYTES: quotaBytes,
			getBytesInUse: (callback: (bytesInUse: number) => {}) => {
				callback(bytesInUse);
			}
		});

		const expectedAppUsage: AppUsage = new AppUsage(bytesInUse, quotaBytes);

		// When
		const promise: Promise<AppUsage> = appUsageDao.get();

		// Then
		promise.then((result: AppUsage) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(expectedAppUsage);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});
});
