import { Inject, Injectable } from "@angular/core";
import { ConnectorType, FileSystemConnectorInfo } from "@elevate/shared/sync";
import { CollectionDef } from "../../data-store/collection-def";
import { ElectronService } from "../../../desktop/electron/electron.service";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";

@Injectable()
export class FileSystemConnectorInfoService {
  /**
   * Embedded DAO. No need to extend from BaseDao. We store in local storage instead of indexed db which might be synced in future
   */
  private static FileSystemConnectorInfoDao = class {
    private static readonly COLLECTION_DEF: CollectionDef<FileSystemConnectorInfo> = new CollectionDef(
      "FILE_SYSTEM_CONNECTOR_INFO",
      null
    );
    private static readonly DEFAULT_STORAGE_VALUE: FileSystemConnectorInfo = FileSystemConnectorInfo.DEFAULT_MODEL;

    public static fetch(): FileSystemConnectorInfo {
      const storedConnectorInfo = localStorage.getItem(
        FileSystemConnectorInfoService.FileSystemConnectorInfoDao.COLLECTION_DEF.name
      );
      const connectorInfo: FileSystemConnectorInfo = storedConnectorInfo ? JSON.parse(storedConnectorInfo) : null;
      if (connectorInfo) {
        return new FileSystemConnectorInfo(
          connectorInfo.sourceDirectory,
          connectorInfo.scanSubDirectories,
          connectorInfo.deleteActivityFilesAfterSync,
          connectorInfo.extractArchiveFiles,
          connectorInfo.deleteArchivesAfterExtract,
          connectorInfo.detectSportTypeWhenUnknown
        );
      } else {
        return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.DEFAULT_STORAGE_VALUE;
      }
    }

    public static save(fileSystemConnectorInfo: FileSystemConnectorInfo): FileSystemConnectorInfo {
      localStorage.setItem(
        FileSystemConnectorInfoService.FileSystemConnectorInfoDao.COLLECTION_DEF.name,
        JSON.stringify(fileSystemConnectorInfo)
      );
      return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.fetch();
    }
  };

  constructor(
    @Inject(ConnectorSyncDateTimeDao) private readonly connectorSyncDateTimeDao: ConnectorSyncDateTimeDao,
    @Inject(ElectronService) private readonly electronService: ElectronService
  ) {}

  public fetch(): FileSystemConnectorInfo {
    return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.fetch();
  }

  public save(fileSystemConnectorInfo: FileSystemConnectorInfo): FileSystemConnectorInfo {
    return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.save(fileSystemConnectorInfo);
  }

  public getSourceDirectory(): string | null {
    const fileSystemConnectorInfo = this.fetch();
    return fileSystemConnectorInfo && fileSystemConnectorInfo.sourceDirectory
      ? fileSystemConnectorInfo.sourceDirectory
      : null;
  }

  public isSourceDirectoryValid(sourceDirectoryParam: string = null): boolean {
    // Test the scan folder validity if exists
    const sourceDirectory = sourceDirectoryParam || this.getSourceDirectory();
    return !sourceDirectory || this.electronService.isDirectory(sourceDirectory);
  }

  public ensureSourceDirectoryCompliance(): Promise<void> {
    if (!this.isSourceDirectoryValid()) {
      // Remove wrong source directory path from config
      const fileSystemConnectorInfo = this.fetch();
      fileSystemConnectorInfo.sourceDirectory = null;
      this.save(fileSystemConnectorInfo);

      // Now remove connector sync date time
      return this.connectorSyncDateTimeDao.removeByConnectorType(ConnectorType.FILE);
    }

    return Promise.resolve();
  }
}
