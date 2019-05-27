import { BaseConnector } from "../base.connector";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";
import { Subject } from "rxjs";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export class FileSystemConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;

	public activitiesLocalPath: string;
	public deleteActivityFilesAfterSync: boolean;
	public parseIntoArchiveFiles: boolean;

	constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, activitiesLocalPath: string,
				deleteActivityFilesAfterSync: boolean, parseIntoArchiveFiles: boolean) {
		super(ConnectorType.FILE_SYSTEM, athleteModel, userSettingsModel, priority, FileSystemConnector.ENABLED);
		this.activitiesLocalPath = activitiesLocalPath;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.parseIntoArchiveFiles = parseIntoArchiveFiles;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}
}
