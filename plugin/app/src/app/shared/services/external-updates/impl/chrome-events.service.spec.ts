import { TestBed } from "@angular/core/testing";
import { ChromeEventsService } from "./chrome-events.service";
import { CoreMessages } from "../../../../../../modules/shared/models";

describe("ChromeEventsService", () => {

	const pluginId = "c061d18abea0";
	let service: ChromeEventsService;

	beforeEach((done: Function) => {

		spyOn(ChromeEventsService, "getBrowserExternalMessages").and.returnValue({
			addListener: () => {
			}
		});

		spyOn(ChromeEventsService, "getBrowserPluginId").and.returnValue(pluginId);

		TestBed.configureTestingModule({
			providers: [ChromeEventsService]
		});

		service = TestBed.get(ChromeEventsService);

		done();
	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		expect(service.onSyncDone).not.toBeNull();
		done();
	});

	it("should handle a sync done from external messages", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.onSyncDone, "next");
		const message: any = {
			message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
			results: {}
		};
		const senderId: string = pluginId;

		// When
		service.onBrowserRequestReceived(message, senderId);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);

		done();
	});

	it("should bypass handle external messages receive if sender is not the plugin it self", (done: Function) => {

		// Given
		const spy = spyOn(service.onSyncDone, "next");
		const message: any = {
			message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
			results: {}
		};
		const senderId = "fakeId";

		// When
		service.onBrowserRequestReceived(message, senderId);

		// Then
		expect(spy).not.toHaveBeenCalled();

		done();
	});

});
