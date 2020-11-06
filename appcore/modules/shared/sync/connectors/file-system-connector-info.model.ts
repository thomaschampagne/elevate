import { ConnectorInfo } from "./connector-info.model";

export class FileSystemConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: FileSystemConnectorInfo = new FileSystemConnectorInfo(null);

  public sourceDirectory: string;
  public scanSubDirectories: boolean;
  public deleteActivityFilesAfterSync: boolean;
  public extractArchiveFiles: boolean;
  public deleteArchivesAfterExtract: boolean;
  public detectSportTypeWhenUnknown: boolean;

  constructor(
    sourceDirectory: string,
    scanSubDirectories: boolean = true,
    deleteActivityFilesAfterSync: boolean = false,
    extractArchiveFiles: boolean = true,
    deleteArchivesAfterExtract: boolean = true,
    detectSportTypeWhenUnknown: boolean = false
  ) {
    super();
    this.sourceDirectory = sourceDirectory;
    this.scanSubDirectories = scanSubDirectories;
    this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
    this.extractArchiveFiles = extractArchiveFiles;
    this.deleteArchivesAfterExtract = deleteArchivesAfterExtract;
    this.detectSportTypeWhenUnknown = detectSportTypeWhenUnknown;
  }
}
