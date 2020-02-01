import { Subject } from "rxjs";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
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
	public syncDateTime: number;

	public abstract sync(): Subject<SyncEvent>;

	public abstract stop(): Promise<void>;

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
	}
}
