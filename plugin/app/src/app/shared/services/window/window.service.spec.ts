import { inject, TestBed } from "@angular/core/testing";

import { WindowService } from "./window.service";
import { ObservableMedia } from "@angular/flex-layout";

describe("WindowService", () => {

	let service: WindowService;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [WindowService, ObservableMedia]
		});

		service = TestBed.get(WindowService);
	});

	it("should be created", inject([WindowService], (service: WindowService) => {
		expect(service).toBeTruthy();
	}));

	it("should notify subscribers when windows is resized", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.resizing, "next");
		const event: Event = new Event("ResizeEvent");

		// When
		service.onResize(event);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(event);
		done();
	});
});
