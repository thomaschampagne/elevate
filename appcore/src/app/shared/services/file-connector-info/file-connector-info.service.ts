import { Inject, Injectable } from "@angular/core";
import { CollectionDef } from "../../data-store/collection-def";
import { ElectronService } from "../../../desktop/electron/electron.service";
import { ConnectorSyncDateTimeDao } from "../../dao/sync/connector-sync-date-time.dao";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

@Injectable()
export class FileConnectorInfoService {
  /**
   * Embedded DAO. No need to extend from BaseDao. We store in local storage instead of indexed db which might be synced in future
   */
  private static FileConnectorInfoDao = class {
    private static readonly COLLECTION_DEF: CollectionDef<FileConnectorInfo> = new CollectionDef(
      "FILE_CONNECTOR_INFO",
      null
    );
    private static readonly DEFAULT_STORAGE_VALUE: FileConnectorInfo = FileConnectorInfo.DEFAULT_MODEL;

    public static fetch(): FileConnectorInfo {
      const storedConnectorInfo = localStorage.getItem(
        FileConnectorInfoService.FileConnectorInfoDao.COLLECTION_DEF.name
      );
      const connectorInfo: FileConnectorInfo = storedConnectorInfo ? JSON.parse(storedConnectorInfo) : null;
      if (connectorInfo) {
        return new FileConnectorInfo(
          connectorInfo.sourceDirectory,
          connectorInfo.scanSubDirectories,
          connectorInfo.deleteActivityFilesAfterSync,
          connectorInfo.extractArchiveFiles,
          connectorInfo.deleteArchivesAfterExtract,
          connectorInfo.detectSportTypeWhenUnknown
        );
      } else {
        return FileConnectorInfoService.FileConnectorInfoDao.DEFAULT_STORAGE_VALUE;
      }
    }

    public static save(fileConnectorInfo: FileConnectorInfo): FileConnectorInfo {
      localStorage.setItem(
        FileConnectorInfoService.FileConnectorInfoDao.COLLECTION_DEF.name,
        JSON.stringify(fileConnectorInfo)
      );
      return FileConnectorInfoService.FileConnectorInfoDao.fetch();
    }
  };

  constructor(
    @Inject(ConnectorSyncDateTimeDao) private readonly connectorSyncDateTimeDao: ConnectorSyncDateTimeDao,
    @Inject(ElectronService) private readonly electronService: ElectronService
  ) {}

  public fetch(): FileConnectorInfo {
    return FileConnectorInfoService.FileConnectorInfoDao.fetch();
  }

  public save(fileConnectorInfo: FileConnectorInfo): FileConnectorInfo {
    return FileConnectorInfoService.FileConnectorInfoDao.save(fileConnectorInfo);
  }

  public getSourceDirectory(): string | null {
    const fileConnectorInfo = this.fetch();
    return fileConnectorInfo && fileConnectorInfo.sourceDirectory ? fileConnectorInfo.sourceDirectory : null;
  }

  public isSourceDirectoryValid(sourceDirectoryParam: string = null): Promise<boolean> {
    // Test the scan folder validity if exists
    const sourceDirectory = sourceDirectoryParam || this.getSourceDirectory();
    if (sourceDirectory) {
      return this.electronService.isDirectory(sourceDirectory);
    }

    // Empty means directory without errors
    return Promise.resolve(true);
  }

  public ensureSourceDirectoryCompliance(): Promise<void> {
    return this.isSourceDirectoryValid().then(valid => {
      if (!valid) {
        // Remove wrong source directory path from config
        const fileConnectorInfo = this.fetch();
        fileConnectorInfo.sourceDirectory = null;
        this.save(fileConnectorInfo);

        // Now remove connector sync date time
        return this.connectorSyncDateTimeDao.removeByConnectorType(ConnectorType.FILE);
      }
      return Promise.resolve();
    });
  }
}
