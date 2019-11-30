import { TestBed } from "@angular/core/testing";

import { IpcRendererMessagesService } from "./ipc-renderer-messages.service";
import { DesktopModule } from "../../modules/desktop.module";
import { SharedModule } from "../../shared.module";
import { CoreModule } from "../../../core/core.module";
import { ElectronService, ElectronWindow } from "../electron/electron.service";
import { IpcRequest } from "promise-tron";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { SyncedActivityModel } from "@elevate/shared/models";
import { ActivitySyncEvent, ConnectorType } from "@elevate/shared/sync";
import FindRequest = PouchDB.Find.FindRequest;

describe("IpcRendererMessagesService", () => {

	let ipcRendererMessagesService: IpcRendererMessagesService;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			]
		});

		const electronService: ElectronService = TestBed.get(ElectronService);
		electronService.instance = <Electron.RendererInterface> {
			ipcRenderer: {}
		};

		const electronWindow = (window as ElectronWindow);
		const electronRequire = (module: string) => {
			console.log("Loading module: " + module);
			return {} as Electron.RendererInterface;
		};
		electronWindow.require = electronRequire;
		spyOn(electronWindow, "require").and.callFake(electronRequire);

		ipcRendererMessagesService = TestBed.get(IpcRendererMessagesService);
		spyOn(ipcRendererMessagesService.promiseTron, "on").and.stub();
		ipcRendererMessagesService.listen();
		done();
	});

	it("should handle incoming ipcRequests", (done: Function) => {

		// Given
		const data = {hello: "world"};
		const ipcRequest = new IpcRequest(data);
		const replyWith = () => {
		};
		const expectedFlaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);
		const forwardMessagesFromIpcMainSpy = spyOn(ipcRendererMessagesService, "forwardMessagesFromIpcMain");

		// When
		ipcRendererMessagesService.onIpcRequest(ipcRequest, replyWith);

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

		const forwardMessagesFromIpcMainSpy = spyOn(ipcRendererMessagesService, "forwardMessagesFromIpcMain");

		// When
		const call = () => {
			ipcRendererMessagesService.onIpcRequest(ipcRequest, replyWith);
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
			const handleSyncEventsMessagesSpy = spyOn(ipcRendererMessagesService, "handleSyncEventsMessages").and.stub();

			// When
			ipcRendererMessagesService.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);

			// Then
			expect(handleSyncEventsMessagesSpy).toHaveBeenCalledWith(flaggedIpcMessage);

			done();
		});

		it("should forward 'find activity' messages", (done: Function) => {
			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.FIND_ACTIVITY);
			const replyWith = () => {
			};
			const handleFindActivityMessagesSpy = spyOn(ipcRendererMessagesService, "handleFindActivityMessages").and.stub();

			// When
			ipcRendererMessagesService.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);

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
			ipcRendererMessagesService.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith.callback);

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
		const syncEventsNextSpy = spyOn(ipcRendererMessagesService.syncEvents$, "next").and.stub();

		// When
		ipcRendererMessagesService.handleSyncEventsMessages(flaggedIpcMessage);

		// Then
		expect(syncEventsNextSpy).toHaveBeenCalledTimes(1);
		expect(syncEventsNextSpy).toHaveBeenCalledWith(activitySyncEvent);
		done();
	});

	it("should find activity from ipc main message", (done: Function) => {

		// Given
		const date = "2019-03-01T10:00:00.000Z";
		const activityDuration = 3600;

		const query: FindRequest<SyncedActivityModel[]> = {
			selector: {
				$or: [
					{
						start_time: {
							$gte: "2019-03-01T10:00:00.000Z",
						},
						end_time: {
							$lte: "2019-03-01T11:00:00.000Z",
						}
					},
					{
						start_time: {
							$gte: "2019-03-01T10:00:00.000Z",
							$lte: "2019-03-01T11:00:00.000Z",
						}
					},
					{
						end_time: {
							$gte: "2019-03-01T10:00:00.000Z",
							$lte: "2019-03-01T11:00:00.000Z",
						}
					}

				]

			}
		};

		const findActivitySpy = spyOn(ipcRendererMessagesService.activityService, "find").and.returnValue(Promise.resolve([]));

		// When
		const promise = ipcRendererMessagesService.findActivities(date, activityDuration);

		// Then
		promise.then(() => {

			expect(findActivitySpy).toHaveBeenCalledTimes(1);
			expect(findActivitySpy).toHaveBeenCalledWith(query);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
