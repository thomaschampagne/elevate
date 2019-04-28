import { Injectable } from "@angular/core";
import { SyncEvent, SyncMessage, SyncMessageResponse } from "@elevate/shared/sync";
import { IpcRequest, PromiseTron } from "promise-tron";
import { ElectronService } from "../electron/electron.service";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { LoggerService } from "../logging/logger.service";

@Injectable()
export class IpcRendererMessagesListenerService {

	public syncEvents: Subject<SyncEvent>;
	public promiseTron: PromiseTron;

	constructor(public electronService: ElectronService,
				public logger: LoggerService) {
		this.syncEvents = new Subject<SyncEvent>();
		this.listen();
	}

	public listen(): void {

		this.promiseTron = new PromiseTron(this.electronService.electron.ipcRenderer);

		// Listen for sync events provided by main process
		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: Function) => {

			const syncMessage = IpcRequest.extractData<SyncMessage>(ipcRequest);

			if (!syncMessage) {
				const message = "Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest);
				this.logger.error(message);
				throw new Error(message);
			}

			this.forwardMessagesFromIpcMain(syncMessage, replyWith);
		});
	}

	public forwardMessagesFromIpcMain(message: SyncMessage, replyWith: Function): void {

		switch (message.flag) {

			case SyncMessage.SYNC_EVENT:
				this.handleSyncEventsMessages(message, replyWith);
				break;

			case SyncMessage.GET_ACTIVITY:
				this.handleGetActivityMessages(message, replyWith);
				break;

			default:
				replyWith(new SyncMessageResponse<string>(message, "Unknown connector"));
				break;

		}
	}

	public handleSyncEventsMessages(message: SyncMessage, replyWith: Function): void {
		const syncEvent = <SyncEvent> _.first(message.payload);
		this.syncEvents.next(syncEvent); // forward sync event
		replyWith(new SyncMessageResponse(message, "Sync event received by IpcRendererMessagesListenerService"));
	}

	public handleGetActivityMessages(message: SyncMessage, replyWith: Function): void {
		throw new NotImplementedException("handleGetActivityMessages");
	}

	public sendMessage<R>(message: SyncMessage): Promise<R> {
		return this.promiseTron.send<R>(message);

	}
}
