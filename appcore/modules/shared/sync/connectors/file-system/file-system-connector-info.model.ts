export class FileSystemConnectorInfo {

	public static readonly DEFAULT_MODEL: FileSystemConnectorInfo = new FileSystemConnectorInfo(null);

	public sourceDirectory: string;
	public scanSubDirectories: boolean;
	public deleteActivityFilesAfterSync: boolean;
	public extractArchiveFiles: boolean;
	public deleteArchivesAfterExtract: boolean;

	constructor(sourceDirectory: string, scanSubDirectories: boolean = false, deleteActivityFilesAfterSync: boolean = false,
				extractArchiveFiles: boolean = false, deleteArchivesAfterExtract: boolean = false) {
		this.sourceDirectory = sourceDirectory;
		this.scanSubDirectories = scanSubDirectories;
		this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
		this.extractArchiveFiles = extractArchiveFiles;
		this.deleteArchivesAfterExtract = deleteArchivesAfterExtract;
	}
}
