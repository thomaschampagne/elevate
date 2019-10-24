import { inject, TestBed } from "@angular/core/testing";
import { GlobalSettingsService } from "./global-settings.service";

describe("GlobalSettingsService", () => {
	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			providers: [GlobalSettingsService]
		});
		done();
	});

	it("should be created", inject([GlobalSettingsService], (service: GlobalSettingsService) => {
		expect(service).toBeTruthy();
	}));
});
