import { BaseConnector } from "./base.connector";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";
import { Subject } from "rxjs";

export class FileSystemConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;

	public activitiesLocalPath: string;
	public deleteActivityFilesAfterSync: boolean;
	public parseIntoArchiveFiles: boolean;

	constructor(priority: number, activitiesLocalPath: string, deleteActivityFilesAfterSync: boolean, parseIntoArchiveFiles: boolean) {
		super(ConnectorType.FILE_SYSTEM, priority, FileSystemConnector.ENABLED);
		this.activitiesLocalPath = activitiesLocalPath;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.parseIntoArchiveFiles = parseIntoArchiveFiles;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}
}
