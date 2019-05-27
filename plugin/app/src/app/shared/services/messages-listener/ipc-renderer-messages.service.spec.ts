import { TestBed } from "@angular/core/testing";

import { IpcRendererMessagesService } from "./ipc-renderer-messages.service";
import { DesktopModule } from "../../modules/desktop.module";
import { SharedModule } from "../../shared.module";
import { CoreModule } from "../../../core/core.module";
import { ElectronService, ElectronWindow } from "../electron/electron.service";
import { IpcRequest } from "promise-tron";
import { FlaggedIpcMessage } from "@elevate/shared/electron";
import { SyncedActivityModel } from "@elevate/shared/models";
import FindRequest = PouchDB.Find.FindRequest;

describe("IpcRendererMessagesService", () => {

	let ipcRendererMessagesService: IpcRendererMessagesService;

	beforeEach(() => {
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

	});

	it("should be created", (done: Function) => {
		const service: IpcRendererMessagesService = TestBed.get(IpcRendererMessagesService);
		expect(service).toBeTruthy();
		done();
	});

	it("should handle incoming ipcRequests", (done: Function) => {

		// Given
		const data = {hello: "world"};
		const ipcRequest = new IpcRequest("fakeResponseId", data);
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
		const ipcRequest = new IpcRequest("fakeResponseId", data);
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
