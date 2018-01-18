import { inject, TestBed } from "@angular/core/testing";
import { CommonSettingsService } from "./common-settings.service";

describe("CommonSettingsService", () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [CommonSettingsService]
		});
	});

	it("should be created", inject([CommonSettingsService], (service: CommonSettingsService) => {
		expect(service).toBeTruthy();
	}));
});
