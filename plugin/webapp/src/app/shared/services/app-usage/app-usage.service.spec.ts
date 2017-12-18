import { TestBed } from '@angular/core/testing';

import { AppUsageService } from './app-usage.service';
import { AppUsageDao } from "../../dao/app-usage/app-usage.dao";
import { AppUsageDetails } from "../../models/app-usage-details.model";

describe('AppUsageService', () => {

	let appUsageService: AppUsageService = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AppUsageService, AppUsageDao]
		});
		// Retrieve injected service
		appUsageService = TestBed.get(AppUsageService);
	});

	it("should be created", (done: Function) => {
		expect(appUsageService).toBeTruthy();
		done();
	});

	it("should provide AppUsageDetails", (done: Function) => {

		// Given
		const quotaBytes = 1024;
		const bytesInUse = 512;
		const appUsage: AppUsageDetails = {
			bytesInUse: bytesInUse,
			quotaBytes: quotaBytes,
			percentUsage: (bytesInUse / quotaBytes * 100),
			megaBytesInUse: (quotaBytes / (1024 * 1024))
		};

		spyOn(appUsageService, "get").and.returnValue(Promise.resolve(appUsage));

		// When
		const promise: Promise<AppUsageDetails> = appUsageService.get();

		// Then
		promise.then((result: AppUsageDetails) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(appUsage);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
