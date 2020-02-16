import { Component, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElectronService } from "../../shared/services/electron/electron.service";
import { ConnectorType, FileSystemConnectorInfo } from "@elevate/shared/sync";
import { FileSystemConnectorInfoService } from "../../shared/services/file-system-connector-info/file-system-connector-info.service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";

@Component({
	selector: "app-file-system-connector",
	templateUrl: "./file-system-connector.component.html",
	styleUrls: ["./file-system-connector.component.scss"]
})
export class FileSystemConnectorComponent extends ConnectorsComponent implements OnInit {

	public showConfigure: boolean;
	public fileSystemConnectorInfo: FileSystemConnectorInfo;

	constructor(public fileSystemConnectorInfoService: FileSystemConnectorInfoService,
				public desktopSyncService: DesktopSyncService,
				public electronService: ElectronService,
				public router: Router,
				public snackBar: MatSnackBar,
				public dialog: MatDialog) {
		super(desktopSyncService, electronService, router, dialog);
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

	public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
		return super.sync().then(() => {
			return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.FILE_SYSTEM);
		}).catch(err => {
			if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
				return Promise.reject(err);
			}
			return Promise.resolve();
		});
	}
}
