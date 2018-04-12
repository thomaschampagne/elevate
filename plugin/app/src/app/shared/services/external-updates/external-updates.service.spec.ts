import { TestBed } from "@angular/core/testing";
import { ExternalUpdatesService } from "./external-updates.service";
import { Messages } from "../../../../../../common/scripts/Messages";

describe("ExternalUpdatesService", () => {

	const pluginId = "c061d18abea0";
	let service: ExternalUpdatesService;

	beforeEach((done: Function) => {

		spyOn(ExternalUpdatesService, "getBrowserExternalMessages").and.returnValue({
			addListener: (request: any, sender: chrome.runtime.MessageSender) => {
			}
		});

		spyOn(ExternalUpdatesService, "getBrowserPluginId").and.returnValue(pluginId);

		TestBed.configureTestingModule({
			providers: [ExternalUpdatesService]
		});

		service = TestBed.get(ExternalUpdatesService);

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
			message: Messages.ON_EXTERNAL_SYNC_DONE,
			results: {}
		};
		const senderId: string = pluginId;

		// When
		service.onExternalRequestReceived(message, senderId);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);

		done();
	});

	it("should bypass handle external messages receive if sender is not the plugin it self", (done: Function) => {

		// Given
		const spy = spyOn(service.onSyncDone, "next");
		const message: any = {
			message: Messages.ON_EXTERNAL_SYNC_DONE,
			results: {}
		};
		const senderId = "fakeId";

		// When
		service.onExternalRequestReceived(message, senderId);

		// Then
		expect(spy).not.toHaveBeenCalled();

		done();
	});

});
