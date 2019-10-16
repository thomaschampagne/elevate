import { BaseConnector } from "../base.connector";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";
import { Subject } from "rxjs";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export class FileSystemConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;

	public activitiesLocalPath: string;
	public deleteActivityFilesAfterSync: boolean;
	public parseIntoArchiveFiles: boolean;

	public static create(athleteModel: AthleteModel, userSettingsModel: UserSettings.UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime, activitiesLocalPath: string,
						 deleteActivityFilesAfterSync: boolean, parseIntoArchiveFiles: boolean) {
		return new FileSystemConnector(null, athleteModel, userSettingsModel, connectorSyncDateTime, activitiesLocalPath,
			deleteActivityFilesAfterSync, parseIntoArchiveFiles);
	}

	constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime, activitiesLocalPath: string,
				deleteActivityFilesAfterSync: boolean, parseIntoArchiveFiles: boolean) {
		super(ConnectorType.FILE_SYSTEM, athleteModel, userSettingsModel, connectorSyncDateTime, priority, FileSystemConnector.ENABLED);
		this.activitiesLocalPath = activitiesLocalPath;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.parseIntoArchiveFiles = parseIntoArchiveFiles;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}

	public stop(): Promise<void> {
		throw new Error("to be done");
	}

}
