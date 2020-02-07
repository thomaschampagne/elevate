import { ReplaySubject, Subject } from "rxjs";
import { ConnectorType, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { AthleteModel, ConnectorSyncDateTime, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Service } from "../service";
import { filter } from "rxjs/operators";
import * as crypto from "crypto";
import { BinaryLike } from "crypto";
import UserSettingsModel = UserSettings.UserSettingsModel;

export abstract class BaseConnector {

	public type: ConnectorType;
	public athleteModel: AthleteModel;
	public userSettingsModel: UserSettingsModel;
	public priority: number;
	public enabled: boolean;
	public isSyncing: boolean;
	public stopRequested: boolean;
	public syncDateTime: number;
	public syncEvents$: ReplaySubject<SyncEvent>;

	public abstract sync(): Subject<SyncEvent>;

	/**
	 * Hash data
	 * @param data
	 * @param divide
	 */
	public static hashData(data: BinaryLike, divide: number = null): string {
		const sha1 = crypto.createHash("sha1").update(data).digest("hex");
		return sha1.slice(0, divide ? sha1.length / divide : sha1.length);
	}

	protected constructor(type: ConnectorType, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime, priority: number, enabled: boolean) {
		this.type = type;
		this.athleteModel = athleteModel;
		this.userSettingsModel = userSettingsModel;
		this.syncDateTime = (connectorSyncDateTime && connectorSyncDateTime.dateTime >= 0)
			? Math.floor(connectorSyncDateTime.dateTime / 1000) : null; // Convert timestamp to seconds instead of millis
		this.priority = priority;
		this.enabled = enabled;
		this.isSyncing = false;
		this.stopRequested = false;
	}

	public stop(): Promise<void> {

		this.stopRequested = true;

		return new Promise((resolve, reject) => {

			if (this.isSyncing) {
				const stopSubscription = this.syncEvents$.pipe(
					filter(syncEvent => syncEvent.type === SyncEventType.STOPPED)
				).subscribe(() => {
					stopSubscription.unsubscribe();
					this.stopRequested = false;
					resolve();
				});
			} else {
				setTimeout(() => {
					this.stopRequested = false;
					reject(this.type + " connector is not syncing currently.");
				});
			}
		});
	}

	/**
	 *
	 * @param activityStartDate
	 * @param activityDurationSeconds
	 */
	public findSyncedActivityModels(activityStartDate: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {
		const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.FIND_ACTIVITY, activityStartDate, activityDurationSeconds);
		return Service.instance().ipcMainMessages.send<SyncedActivityModel[]>(flaggedIpcMessage);
	}
}
