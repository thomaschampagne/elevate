import { TestBed } from "@angular/core/testing";

import { IpcMessagesReceiver } from "./ipc-messages-receiver.service";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { IpcRequest } from "promise-tron";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { SyncedActivityModel } from "@elevate/shared/models";
import { ActivitySyncEvent, ConnectorType } from "@elevate/shared/sync";
import { PROMISE_TRON } from "./promise-tron.interface";
import { PromiseTronServiceMock } from "./promise-tron.service.mock";

describe("IpcMessagesReceiver", () => {

	let ipcMessagesReceiver: IpcMessagesReceiver;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			],
			providers: [
				{provide: PROMISE_TRON, useClass: PromiseTronServiceMock}
			]
		});

		ipcMessagesReceiver = TestBed.inject(IpcMessagesReceiver);
		spyOn(ipcMessagesReceiver.promiseTron, "on").and.stub();
		ipcMessagesReceiver.listen();
		done();
	});

	it("should handle incoming ipcRequests", (done: Function) => {

		// Given
		const data = {hello: "world"};
		const ipcRequest = new IpcRequest(data);
		const replyWith = () => {
		};
		const expectedFlaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);
		const forwardMessagesFromIpcMainSpy = spyOn(ipcMessagesReceiver, "forwardMessagesFromIpcMain");

		// When
		ipcMessagesReceiver.onIpcRequest(ipcRequest, replyWith);

		// Then
		expect(forwardMessagesFromIpcMainSpy).toHaveBeenCalledTimes(1);
		expect(forwardMessagesFromIpcMainSpy).toHaveBeenCalledWith(expectedFlaggedIpcMessage, replyWith);

		done();
	});

	it("should handle incoming ipcRequests with no IpcRequest extracted data", (done: Function) => {

		// Given
		const data = {hello: "world"};
		const ipcRequest = new IpcRequest(data);
		const replyWith = () => {
		};
		const expectedError = new Error("Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest));

		spyOn(IpcRequest, "extractData").and.returnValue(null);

		const forwardMessagesFromIpcMainSpy = spyOn(ipcMessagesReceiver, "forwardMessagesFromIpcMain");

		// When
		const call = () => {
			ipcMessagesReceiver.onIpcRequest(ipcRequest, replyWith);
		};

		// Then
		expect(call).toThrow(expectedError);
		expect(forwardMessagesFromIpcMainSpy).not.toHaveBeenCalled();

		done();
	});

	describe("Forward received messages from IpcMain", () => {

		it("should forward 'sync event' messages", (done: Function) => {
			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT);
			const replyWith = () => {
			};
			const handleSyncEventsMessagesSpy = spyOn(ipcMessagesReceiver, "handleSyncEventsMessages").and.stub();

			// When
			ipcMessagesReceiver.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);

			// Then
			expect(handleSyncEventsMessagesSpy).toHaveBeenCalledWith(flaggedIpcMessage);

			done();
		});

		it("should forward 'find activity' messages", (done: Function) => {
			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.FIND_ACTIVITY);
			const replyWith = () => {
			};
			const handleFindActivityMessagesSpy = spyOn(ipcMessagesReceiver, "handleFindActivityMessages").and.stub();

			// When
			ipcMessagesReceiver.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);

			// Then
			expect(handleFindActivityMessagesSpy).toHaveBeenCalledWith(flaggedIpcMessage, replyWith);

			done();
		});

		it("should handle unknown Messages received", (done: Function) => {

			// Given
			const fakeFlag = -1;
			const flaggedIpcMessage = new FlaggedIpcMessage(fakeFlag);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: null,
					error: "Unknown message received by IpcRenderer. FlaggedIpcMessage: " + JSON.stringify(flaggedIpcMessage)
				}
			};
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMessagesReceiver.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(replyWithCallbackSpy).toHaveBeenCalledWith(replyWith.args);
			done();
		});

	});

	it("should handle 'sync event' messages received", (done: Function) => {

		// Given
		const syncedActivity = <SyncedActivityModel> {}; // Fake SyncedActivityModel
		const activitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null,
			syncedActivity, true);
		const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, activitySyncEvent);
		const syncEventsNextSpy = spyOn(ipcMessagesReceiver.syncEvents$, "next").and.stub();

		// When
		ipcMessagesReceiver.handleSyncEventsMessages(flaggedIpcMessage);

		// Then
		expect(syncEventsNextSpy).toHaveBeenCalledTimes(1);
		expect(syncEventsNextSpy).toHaveBeenCalledWith(activitySyncEvent);
		done();
	});
});
