import { BaseConnector } from "./base.connector";
import { NotImplementedException } from "../../exceptions";
import { SyncEvent } from "../events";
import { Subject } from "rxjs";

export class FileSystemConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;
	public static readonly NAME: string = "FS_CONNECTOR";

	public activitiesLocalPath: string;
	public deleteActivityFilesAfterSync: boolean;
	public parseIntoArchiveFiles: boolean;

	constructor(priority: number, activitiesLocalPath: string, deleteActivityFilesAfterSync: boolean, parseIntoArchiveFiles: boolean) {
		super(FileSystemConnector.NAME, priority, FileSystemConnector.ENABLED);
		this.activitiesLocalPath = activitiesLocalPath;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.parseIntoArchiveFiles = parseIntoArchiveFiles;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}
}
