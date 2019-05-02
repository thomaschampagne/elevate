import { TestBed } from "@angular/core/testing";

import { StravaApiCredentialsDao } from "./strava-api-credentials.dao";

describe("StravaApiCredentialsDao", () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", () => {
		const service: StravaApiCredentialsDao = TestBed.get(StravaApiCredentialsDao);
		expect(service).toBeTruthy();
	});
});
