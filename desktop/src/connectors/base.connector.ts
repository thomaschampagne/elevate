import { Subject } from "rxjs";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export abstract class BaseConnector {

	public type: ConnectorType;
	public athleteModel: AthleteModel;
	public userSettingsModel: UserSettingsModel;
	public priority: number;
	public enabled: boolean;
	public isSyncing: boolean;

	public abstract sync(): Subject<SyncEvent>;

	public abstract stop(): Promise<void>;

	protected constructor(type: ConnectorType, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, priority: number, enabled: boolean) {
		this.type = type;
		this.athleteModel = athleteModel;
		this.userSettingsModel = userSettingsModel;
		this.priority = priority;
		this.enabled = enabled;
		this.isSyncing = false;
	}
}
