import { TestBed } from "@angular/core/testing";

import { StravaApiCredentialsService } from "./strava-api-credentials.service";

describe("StravaApiCredentialsService", () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", () => {
		const service: StravaApiCredentialsService = TestBed.get(StravaApiCredentialsService);
		expect(service).toBeTruthy();
	});
});
