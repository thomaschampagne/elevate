import { Injectable } from "@angular/core";
import { SyncEvent } from "@elevate/shared/sync";
import { FlaggedIpcMessage } from "@elevate/shared/electron";
import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { ElectronService } from "../electron/electron.service";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { LoggerService } from "../logging/logger.service";
import { MessageFlag } from "@elevate/shared/electron/message-flag.enum";

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

			const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

			if (!flaggedIpcMessage) {
				const message = "Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest);
				this.logger.error(message);
				throw new Error(message);
			}

			this.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);
		});
	}

	public forwardMessagesFromIpcMain(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case MessageFlag.SYNC_EVENT:
				this.handleSyncEventsMessages(message, replyWith);
				break;

			case MessageFlag.GET_ACTIVITY:
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

	public handleSyncEventsMessages(flaggedIpcMessage: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		const syncEvent = <SyncEvent> _.first(flaggedIpcMessage.payload);
		this.syncEvents.next(syncEvent); // forward sync event
		replyWith({
			success: "Sync event received by IpcRendererMessagesListenerService",
			error: null
		});

	}

	public handleGetActivityMessages(flaggedIpcMessage: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		throw new NotImplementedException("handleGetActivityMessages");
	}

	public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
		return <Promise<T>> this.promiseTron.send(flaggedIpcMessage);
	}
}
