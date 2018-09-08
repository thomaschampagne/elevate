import { inject, TestBed } from "@angular/core/testing";

import { WindowService } from "./window.service";
import { ObservableMedia } from "@angular/flex-layout";

describe("WindowService", () => {

	let service: WindowService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [WindowService, ObservableMedia]
		});

		service = TestBed.get(WindowService);

		done();
	});

	it("should be created", inject([WindowService], (service: WindowService) => {
		expect(service).toBeTruthy();
	}));

	it("should notify subscribers when windows is resized", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.resizing, "next");

		// When
		service.onResize();

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		done();
	});
});
