import { ConnectorInfo } from "./connector-info.model";

export class FileConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: FileConnectorInfo = new FileConnectorInfo(null);

  public sourceDirectory: string;
  public scanSubDirectories: boolean;
  public deleteActivityFilesAfterSync: boolean;
  public extractArchiveFiles: boolean;
  public deleteArchivesAfterExtract: boolean;
  public renameActivityFiles: boolean;
  public detectSportTypeWhenUnknown: boolean;

  constructor(
    sourceDirectory: string,
    scanSubDirectories: boolean = true,
    deleteActivityFilesAfterSync: boolean = false,
    extractArchiveFiles: boolean = true,
    deleteArchivesAfterExtract: boolean = true,
    renameActivityFiles: boolean = false,
    detectSportTypeWhenUnknown: boolean = false
  ) {
    super();
    this.sourceDirectory = sourceDirectory;
    this.scanSubDirectories = scanSubDirectories;
    this.deleteActivityFilesAfterSync = deleteActivityFilesAfterSync;
    this.extractArchiveFiles = extractArchiveFiles;
    this.deleteArchivesAfterExtract = deleteArchivesAfterExtract;
    this.renameActivityFiles = renameActivityFiles;
    this.detectSportTypeWhenUnknown = detectSportTypeWhenUnknown;
  }
}
