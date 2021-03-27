import { Inject, Injectable } from "@angular/core";
import { StaticUpdateNotify, UpdateNotify } from "@elevate/shared/models";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { IPC_TUNNEL_SERVICE } from "../ipc/ipc-tunnel-service.token";
import pDefer from "p-defer";
import { WarningException } from "@elevate/shared/exceptions";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { IpcStorageService } from "../ipc/ipc-storage.service";
import { sleep } from "@elevate/shared/tools";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElectronService } from "../electron/electron.service";
import { OPEN_RESOURCE_RESOLVER } from "../../shared/services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../../shared/services/links-opener/impl/desktop-open-resource-resolver.service";

@Injectable()
export class DesktopUpdateService {
  private static readonly CONFIG_ACCEPT_PRE_RELEASES = "config.update.acceptPreReleases";
  private static readonly CONFIG_CHECK_INTERVAL_SEC = "config.update.checkIntervalSec";
  private static readonly UPDATE_CHECK_INTERVAL_SEC = 60 * 60; // 60 minutes

  private static readonly WAIT_BEFORE_CLOSING_APP_ON_STATIC_DL = 1500;

  public readonly updateNotify$: Subject<UpdateNotify>;
  public readonly downloadUpdate$: Subject<number>;
  public updateHandledPromise: pDefer.DeferredPromise<void>;

  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(IpcStorageService) private readonly ipcStorageService: IpcStorageService,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: DesktopOpenResourceResolver,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.updateNotify$ = new Subject<UpdateNotify>();
    this.downloadUpdate$ = new Subject<number>();
    this.listenForUpdateDownloadProgress();

    // Check update interval
    this.ipcStorageService.get<number>(DesktopUpdateService.CONFIG_CHECK_INTERVAL_SEC).then(checkIntervalSec => {
      setInterval(
        () => this.checkForUpdate(),
        (checkIntervalSec || DesktopUpdateService.UPDATE_CHECK_INTERVAL_SEC) * 1000
      );
    });
  }

  public handleUpdate(): Promise<void> {
    this.updateHandledPromise = pDefer<void>();

    this.updateApp()
      .then(updateNotify => {
        if (updateNotify) {
          this.updateNotify$.next(updateNotify);
        } else {
          // No updates
          this.updateHandledPromise.resolve();
        }
      })
      .catch(error => {
        // In case of error, we consider no updates... So continue
        this.updateHandledPromise.resolve();
        this.logger.error(error);
        throw new WarningException(error.message);
      });

    return this.updateHandledPromise.promise;
  }

  private updateApp(): Promise<UpdateNotify> {
    return this.ipcStorageService
      .get<boolean>(DesktopUpdateService.CONFIG_ACCEPT_PRE_RELEASES)
      .then(acceptPreReleases => {
        return this.ipcTunnelService.send<IpcMessage, UpdateNotify>(
          new IpcMessage(Channel.updateApp, !!acceptPreReleases)
        );
      });
  }

  public checkForUpdate(): void {
    this.ipcStorageService
      .get(DesktopUpdateService.CONFIG_ACCEPT_PRE_RELEASES)
      .then(acceptPreReleases => {
        return this.ipcTunnelService.send<IpcMessage, UpdateNotify>(
          new IpcMessage(Channel.checkForUpdate, !!acceptPreReleases)
        );
      })
      .then(updateNotify => {
        if (updateNotify) {
          this.updateNotify$.next(updateNotify);
        }
      })
      .catch(error => {
        // In case of error, we consider no updates... So continue
        this.logger.error(error);
        throw new WarningException(error.message || error);
      });
  }

  public onStaticDownload(staticUpdateNotify: StaticUpdateNotify, closeApp: boolean): void {
    let promiseWait = Promise.resolve();

    if (closeApp) {
      this.snackBar.open("Now closing app to apply update");
      promiseWait = sleep(DesktopUpdateService.WAIT_BEFORE_CLOSING_APP_ON_STATIC_DL);
    }

    promiseWait
      .then(() => {
        return this.openResourceResolver.openLink(staticUpdateNotify.downloadUrl);
      })
      .then(() => {
        return this.openResourceResolver.openLink(staticUpdateNotify.releaseUrl);
      })
      .then(() => {
        if (closeApp) {
          this.electronService.closeApp(true);
        }
      });
  }

  private listenForUpdateDownloadProgress(): void {
    this.ipcTunnelService.on<[number], void>(Channel.updateDownloadProgress, payload => {
      const [progress] = payload;
      this.downloadUpdate$.next(progress);

      if (progress === 100) {
        this.downloadUpdate$.complete();
      }
    });
  }

  public skipStaticUpdate(): void {
    this.updateHandledPromise.resolve();
  }
}
