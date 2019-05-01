import { Injectable } from "@angular/core";
import { SyncEvent, SyncMessage } from "@elevate/shared/sync";
import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { ElectronService } from "../electron/electron.service";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { LoggerService } from "../logging/logger.service";

@Injectable()
export class IpcRendererMessagesService {

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
		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {

			const syncMessage = IpcRequest.extractData<SyncMessage>(ipcRequest);

			if (!syncMessage) {
				const message = "Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest);
				this.logger.error(message);
				throw new Error(message);
			}

			this.forwardMessagesFromIpcMain(syncMessage, replyWith);
		});
	}

	public forwardMessagesFromIpcMain(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case SyncMessage.FLAG_SYNC_EVENT:
				this.handleSyncEventsMessages(message, replyWith);
				break;

			case SyncMessage.FLAG_GET_ACTIVITY:
				this.handleGetActivityMessages(message, replyWith);
				break;

			default:
				replyWith({
					success: null,
					error: "Unknown connector"
				});
				break;

		}
	}

	public handleSyncEventsMessages(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		const syncEvent = <SyncEvent> _.first(message.payload);
		this.syncEvents.next(syncEvent); // forward sync event
		replyWith({
			success: "Sync event received by IpcRendererMessagesListenerService",
			error: null
		});

	}

	public handleGetActivityMessages(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		throw new NotImplementedException("handleGetActivityMessages");
	}

	public sendMessage<T>(message: SyncMessage): Promise<T> {
		return <Promise<T>> this.promiseTron.send(message);
	}
}
