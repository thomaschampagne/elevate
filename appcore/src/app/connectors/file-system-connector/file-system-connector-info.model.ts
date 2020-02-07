export class FileSystemConnectorInfo {

	public static readonly DEFAULT_MODEL: FileSystemConnectorInfo = new FileSystemConnectorInfo(null);

	public sourceDirectory: string;
	public scanSubDirectories: boolean;
	public deleteActivityFilesAfterSync: boolean;
	public scanArchivesFiles: boolean;

	constructor(sourceDirectory: string, scanSubDirectories: boolean = false, deleteActivityFilesAfterSync: boolean = false, scanArchivesFiles: boolean = false) {
		this.sourceDirectory = sourceDirectory;
		this.scanSubDirectories = scanSubDirectories;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.scanArchivesFiles = scanArchivesFiles;
	}
}
