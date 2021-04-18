import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { VersionsProvider } from "../versions-provider";
import { MatDialog } from "@angular/material/dialog";
import { Platform } from "@elevate/shared/enums";
import { GhRelease } from "@elevate/shared/models";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { IpcStorageService } from "../../../../desktop/ipc/ipc-storage.service";

@Injectable()
export class DesktopVersionsProvider extends VersionsProvider {
  private static readonly IPC_STORAGE_INSTALLED_VERSION_PATH = "version";

  constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(IpcStorageService) public readonly ipcStorageService: IpcStorageService,
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(httpClient, dialog);
  }

  public getGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    return this.ipcTunnelService.send<IpcMessage, GhRelease[]>(
      new IpcMessage(Channel.listUpdates, !!acceptPreReleases)
    );
  }

  public getExistingVersion(): Promise<string> {
    return this.ipcStorageService.get<string>(DesktopVersionsProvider.IPC_STORAGE_INSTALLED_VERSION_PATH);
  }

  public setExistingVersion(version: string): Promise<void> {
    return this.ipcStorageService.set<string>(DesktopVersionsProvider.IPC_STORAGE_INSTALLED_VERSION_PATH, version);
  }

  public getBuildMetadata(): Promise<{ commit: string; date: string }> {
    const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
    return Promise.resolve(buildMetadata as { commit: string; date: string });
  }

  public getPlatform(): Platform {
    return this.electronService.getPlatform();
  }

  public getWrapperVersion(): string {
    return "Electron " + this.electronService.api.electronVersion;
  }
}
