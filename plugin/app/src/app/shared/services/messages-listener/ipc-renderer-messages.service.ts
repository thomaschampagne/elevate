import { Injectable } from "@angular/core";
import { SyncEvent } from "@elevate/shared/sync";
import { FlaggedIpcMessage } from "@elevate/shared/electron";
import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { ElectronService } from "../electron/electron.service";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { LoggerService } from "../logging/logger.service";
import { MessageFlag } from "@elevate/shared/electron/message-flag.enum";
import { SyncedActivityModel } from "@elevate/shared/models";
import { ActivityService } from "../activity/activity.service";
import FindRequest = PouchDB.Find.FindRequest;

@Injectable()
export class IpcRendererMessagesService {

	public syncEvents$: Subject<SyncEvent>;
	public promiseTron: PromiseTron;
	public isListening: boolean;

	constructor(public electronService: ElectronService,
				public activityService: ActivityService,
				public logger: LoggerService) {
		this.syncEvents$ = new Subject<SyncEvent>();
		this.promiseTron = new PromiseTron(this.electronService.electron.ipcRenderer);
		this.isListening = false;
	}

	public listen(): void {

		if (this.isListening) {
			return;
		}

		// Listen for sync events provided by main process
		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {
			this.onIpcRequest(ipcRequest, replyWith);
		});

		this.isListening = true;
	}

	public onIpcRequest(ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

		if (!flaggedIpcMessage) {
			const message = "Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest);
			this.logger.error(message);
			throw new Error(message);
		}

		this.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);
	}

	public forwardMessagesFromIpcMain(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case MessageFlag.SYNC_EVENT:
				this.handleSyncEventsMessages(message);
				break;

			case MessageFlag.FIND_ACTIVITY:
				this.handleFindActivityMessages(message, replyWith);
				break;

			default:
				this.handleUnknownMessage(message, replyWith);
				break;

		}
	}

	public handleSyncEventsMessages(flaggedIpcMessage: FlaggedIpcMessage): void {
		const syncEvent = <SyncEvent> _.first(flaggedIpcMessage.payload);
		this.syncEvents$.next(syncEvent); // forward sync event
	}

	public handleFindActivityMessages(flaggedIpcMessage: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		const startTime = <string> flaggedIpcMessage.payload[0];
		const activityDurationSeconds = <number> flaggedIpcMessage.payload[1];

		this.findActivities(startTime, activityDurationSeconds).then(activities => {
			replyWith({
				success: activities,
				error: null
			});
		}, error => {
			replyWith({
				success: null,
				error: error
			});
		});
	}

	public handleUnknownMessage(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		const errorMessage = "Unknown message received by IpcRenderer. FlaggedIpcMessage: " + JSON.stringify(message);
		replyWith({
			success: null,
			error: errorMessage
		});
	}

	public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
		return <Promise<T>> this.promiseTron.send(flaggedIpcMessage);
	}

	public findActivities(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {

		const activityStartTime = new Date(startTime).toISOString();
		const endDate = new Date(activityStartTime);
		endDate.setSeconds(endDate.getSeconds() + activityDurationSeconds);
		const activityEndTime = endDate.toISOString();

		const query: FindRequest<SyncedActivityModel[]> = {
			selector: {
				$or: [
					{
						start_time: {
							$gte: activityStartTime,
						},
						end_time: {
							$lte: activityEndTime,
						}
					},
					{
						start_time: {
							$gte: activityStartTime,
							$lte: activityEndTime,
						}
					},
					{
						end_time: {
							$gte: activityStartTime,
							$lte: activityEndTime,
						}
					}

				]

			}
		};

		return this.activityService.find(query);
	}
}
