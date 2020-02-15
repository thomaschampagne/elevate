import { TestBed } from "@angular/core/testing";

import { DesktopEventsService } from "./desktop-events.service";

describe("DesktopEventsService", () => {
	beforeEach(() => TestBed.configureTestingModule({
		providers: [DesktopEventsService]
	}));

	it("should be created", () => {
		const service: DesktopEventsService = TestBed.inject(DesktopEventsService);
		expect(service).toBeTruthy();
	});
});
