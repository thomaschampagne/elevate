import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElectronService } from "../../electron/electron.service";
import { FileConnectorInfoService } from "../../../shared/services/file-connector-info/file-connector-info.service";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../../shared/services/links-opener/open-resource-resolver";
import { Subscription } from "rxjs";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { AppService } from "../../../shared/services/app-service/app.service";
import { FileConnectorService } from "./file-connector.service";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

@Component({
  selector: "app-file-connector",
  templateUrl: "./file-connector.component.html",
  styleUrls: ["./file-connector.component.scss"]
})
export class FileConnectorComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public showConfigure: boolean;
  public fileConnectorInfo: FileConnectorInfo;
  public historyChangesSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(FileConnectorInfoService) protected readonly fsConnectorInfoService: FileConnectorInfoService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(FileConnectorService) protected readonly fileConnectorService: FileConnectorService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.FILE;
    this.showConfigure = false;
    this.fileConnectorInfo = null;
  }

  public ngOnInit(): void {
    this.fileConnectorInfo = this.fsConnectorInfoService.fetch();
    this.updateSyncDateTimeText();

    // Test if source directory folder exists on app load
    if (!this.isExistingFolder(this.fileConnectorInfo.sourceDirectory)) {
      this.fileConnectorInfo.sourceDirectory = null;
      this.saveChanges();
    }

    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public onUserDirectorySelection(): void {
    this.electronService.userDirectorySelection().then(directory => this.configureSourceDirectory(directory));
  }

  public onUserDirectoryOpen(): void {
    this.electronService.openItem(this.fileConnectorInfo.sourceDirectory);
  }

  public configureSourceDirectory(path: string): void {
    this.isExistingFolder(path).then(isExistingFolder => {
      if (isExistingFolder) {
        this.fileConnectorInfo.sourceDirectory = path;
        this.saveChanges();
      } else {
        if (path) {
          this.snackBar.open(`Directory ${path} is invalid`);
        }
      }
    });
  }

  public saveChanges(): void {
    if (!this.fileConnectorInfo.extractArchiveFiles) {
      this.fileConnectorInfo.deleteArchivesAfterExtract = false;
    }
    this.fsConnectorInfoService.save(this.fileConnectorInfo);
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.fileConnectorService.sync(fastSync, forceSync).catch(err => {
      if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    });
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }

  private isExistingFolder(path: string): Promise<boolean> {
    return this.electronService.isDirectory(path);
  }
}
