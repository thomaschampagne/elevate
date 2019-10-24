import { TestBed } from "@angular/core/testing";
import { ExtensionEventsService } from "./extension-events.service";
import { CoreMessages, SyncResultModel } from "../../../../../../modules/shared/models";

describe("ExtensionEventsService", () => {

	const pluginId = "c061d18abea0";
	let service: ExtensionEventsService;

	beforeEach((done: Function) => {

		spyOn(ExtensionEventsService, "getBrowserExternalMessages").and.returnValue({
			addListener: () => {
			}
		});

		spyOn(ExtensionEventsService, "getBrowserPluginId").and.returnValue(pluginId);

		TestBed.configureTestingModule({
			providers: [ExtensionEventsService]
		});

		service = TestBed.get(ExtensionEventsService);

		done();
	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		expect(service.onSyncDone).not.toBeNull();
		done();
	});

	it("should handle a sync done WITH changes from external messages", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.onSyncDone, "next");
		const expectedChangesFromSync = true;
		const message: any = {
			message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
			results: <SyncResultModel> {
				activitiesChangesModel: {
					added: [null, null],
					edited: [null],
					deleted: []
				}
			}
		};
		const senderId: string = pluginId;

		// When
		service.onBrowserRequestReceived(message, senderId);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(expectedChangesFromSync);

		done();
	});

	it("should not handle a sync done WITHOUT changes from external messages", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.onSyncDone, "next");
		const expectedChangesFromSync = false;
		const message: any = {
			message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
			results: <SyncResultModel> {
				activitiesChangesModel: {
					added: [],
					edited: [],
					deleted: []
				}
			}
		};
		const senderId: string = pluginId;

		// When
		service.onBrowserRequestReceived(message, senderId);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(expectedChangesFromSync);

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
