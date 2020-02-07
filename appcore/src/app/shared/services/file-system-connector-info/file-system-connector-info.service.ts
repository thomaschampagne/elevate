import { Injectable } from "@angular/core";
import { FileSystemConnectorInfo } from "../../../connectors/file-system-connector/file-system-connector-info.model";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";

@Injectable()
export class FileSystemConnectorInfoService {

	/**
	 * Embedded DAO. No need to extend from BaseDao. We store in local storage instead of indexed db which might be synced in future
	 */
	private static FileSystemConnectorInfoDao = class {

		private static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("FILE_SYSTEM_CONNECTOR_INFO", StorageType.OBJECT);
		private static readonly DEFAULT_STORAGE_VALUE: FileSystemConnectorInfo = FileSystemConnectorInfo.DEFAULT_MODEL;

		public static fetch(): FileSystemConnectorInfo {
			const storedConnectorInfo = localStorage.getItem(FileSystemConnectorInfoService.FileSystemConnectorInfoDao.STORAGE_LOCATION.key);
			const connectorInfo: FileSystemConnectorInfo = storedConnectorInfo ? JSON.parse(storedConnectorInfo) : null;
			if (connectorInfo) {
				return new FileSystemConnectorInfo(connectorInfo.sourceDirectory, connectorInfo.scanSubDirectories, connectorInfo.scanArchivesFiles);
			} else {
				return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.DEFAULT_STORAGE_VALUE;
			}
		}

		public static save(fileSystemConnectorInfo: FileSystemConnectorInfo): FileSystemConnectorInfo {
			localStorage.setItem(FileSystemConnectorInfoService.FileSystemConnectorInfoDao.STORAGE_LOCATION.key, JSON.stringify(fileSystemConnectorInfo));
			return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.fetch();
		}
	};

	public fetch(): FileSystemConnectorInfo {
		return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.fetch();
	}

	public save(fileSystemConnectorInfo: FileSystemConnectorInfo): FileSystemConnectorInfo {
		return FileSystemConnectorInfoService.FileSystemConnectorInfoDao.save(fileSystemConnectorInfo);
	}
}
