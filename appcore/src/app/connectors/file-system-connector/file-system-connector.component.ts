import { Component, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ElectronService } from "../../shared/services/electron/electron.service";
import { ConnectorType, FileSystemConnectorInfo } from "@elevate/shared/sync";
import { FileSystemConnectorInfoService } from "../../shared/services/file-system-connector-info/file-system-connector-info.service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";

@Component({
	selector: "app-file-system-connector",
	templateUrl: "./file-system-connector.component.html",
	styleUrls: ["./file-system-connector.component.scss"]
})
export class FileSystemConnectorComponent extends ConnectorsComponent implements OnInit {

	public showConfigure: boolean;
	public fileSystemConnectorInfo: FileSystemConnectorInfo;

	constructor(public fileSystemConnectorInfoService: FileSystemConnectorInfoService,
				public syncService: DesktopSyncService,
				public electronService: ElectronService,
				public snackBar: MatSnackBar,
				public dialog: MatDialog) {
		super(electronService, dialog);
		this.showConfigure = false;
		this.fileSystemConnectorInfo = null;
	}

	public ngOnInit(): void {
		this.fileSystemConnectorInfo = this.fileSystemConnectorInfoService.fetch();
	}

	public onUserDirectorySelection(): void {
		this.configureSourceDirectory(this.electronService.userDirectorySelection());
	}

	public configureSourceDirectory(path: string): void {
		const compliant = path && this.electronService.isDirectory(path);
		if (compliant) {
			this.fileSystemConnectorInfo.sourceDirectory = path;
			this.saveChanges();
		} else {
			if (path) {
				this.snackBar.open(`Directory ${path} is invalid`);
			}
		}
	}

	public saveChanges(): void {
		if (!this.fileSystemConnectorInfo.extractArchiveFiles) {
			this.fileSystemConnectorInfo.deleteArchivesAfterExtract = false;
		}
		this.fileSystemConnectorInfoService.save(this.fileSystemConnectorInfo);
	}

	public sync(): Promise<void> {
		const desktopSyncService = <DesktopSyncService> this.syncService;
		return desktopSyncService.sync(null, null, ConnectorType.FILE_SYSTEM);
	}
}
