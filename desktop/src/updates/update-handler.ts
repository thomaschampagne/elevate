import { repository, version as installedVersion } from "../../package.json";
import { inject, singleton } from "tsyringe";
import { HttpClient } from "../clients/http.client";
import { Logger } from "../logger";
import { Arch, Platform } from "@elevate/shared/enums";
import semverGreaterThan from "semver/functions/gt";
import semverEquals from "semver/functions/eq";
import _ from "lodash";
import { AppService } from "../app-service";
import { AutoUpdateNotify, GhAsset, GhRelease, StaticUpdateNotify, UpdateNotify } from "@elevate/shared/models";
import { IpcMainTunnelService } from "../ipc-main-tunnel.service";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { AppUpdater } from "electron-updater/out/AppUpdater";
import { UpdateInfo } from "electron-updater";
import { IpcListener } from "../listeners/ipc-listener.interface";
import { UpdateFileInfo } from "builder-util-runtime/out/updateInfo";
import { ProgressInfo } from "electron-updater/out/differentialDownloader/ProgressDifferentialDownloadCallbackTransform";
import { HttpCodes } from "typed-rest-client/HttpClient";
import { ElevateException } from "@elevate/shared/exceptions";
import { Subject } from "rxjs";
import pDefer from "p-defer";

enum AutoUpdateEvent {
  CHECKING_FOR_UPDATE = "checking-for-update",
  UPDATE_AVAILABLE = "update-available",
  UPDATE_NOT_AVAILABLE = "update-not-available",
  ERROR = "error",
  DOWNLOAD_PROGRESS = "download-progress",
  UPDATE_DOWNLOADED = "update-downloaded"
}

@singleton()
export class UpdateHandler implements IpcListener {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(IpcMainTunnelService) private readonly ipcTunnelService: IpcTunnelService,
    @inject(HttpClient) private readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {
    this.autoUpdater = null;
    this.autoUpdateNotify$ = null;
    this.autoUpdateQuitInstall = UpdateHandler.DEFAULT_AUTO_UPDATE_QUIT_INSTALL;
  }

  private static readonly ACCEPT_PRE_RELEASES: boolean = false;
  private static readonly AUTO_INSTALL_ON_APP_QUIT: boolean = false;
  private static readonly DEFAULT_AUTO_DOWNLOAD: boolean = true;
  private static readonly DEFAULT_AUTO_UPDATE_QUIT_INSTALL: boolean = false;

  private static readonly PLATFORM_AUTO_UPDATABLE_MAP = new Map<Platform, boolean>([
    [Platform.WINDOWS, true],
    [Platform.LINUX, false],
    [Platform.MACOS, false]
  ]);

  private static readonly ARCH_TARGET_PATTERN_MAP = new Map<Arch, Arch | null>([
    [Arch.X64, null],
    [Arch.ARM64, Arch.ARM64]
  ]);

  private static readonly PLATFORM_FILE_PATTERN_MAP = new Map<Platform, (arch: Arch) => string>([
    [Platform.WINDOWS, arch => (arch ? `.*-${arch}.exe$` : `.exe$`)],
    [Platform.MACOS, arch => (arch ? `.*-(${arch}|universal).dmg$` : `.dmg$`)],
    [Platform.LINUX, arch => (arch ? `.*-${arch}.deb$` : `.deb$`)]
  ]);

  private autoUpdater: AppUpdater;
  private autoUpdateNotify$: Subject<AutoUpdateNotify>;
  private autoUpdateQuitInstall: boolean;

  private static getGithubReleasesApiEndpoint(repoUrl: string): string {
    // Find out the short repo name from repo url
    const shortRepoName = repoUrl.split("/").slice(3, 5).join("/");
    return `https://api.github.com/repos/${shortRepoName}/releases`;
  }

  public static requireAutoUpdater(): AppUpdater {
    // Import should remains w/ "require" at the moment. Integration with rollup & es6 import not fully supported. Current import workaround: package.json > build > files > "./node_modules/%%/%"
    const { autoUpdater } = require("electron-updater");
    return autoUpdater;
  }

  public fetchConfigureAutoUpdater(): AppUpdater {
    const autoUpdater = UpdateHandler.requireAutoUpdater();
    autoUpdater.logger = this.logger.base;
    autoUpdater.allowPrerelease = UpdateHandler.ACCEPT_PRE_RELEASES;
    autoUpdater.autoInstallOnAppQuit = UpdateHandler.AUTO_INSTALL_ON_APP_QUIT;
    autoUpdater.autoDownload = UpdateHandler.DEFAULT_AUTO_DOWNLOAD;
    return autoUpdater;
  }

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // On list updates requested
    this.ipcTunnelService.on<Array<[boolean]>, GhRelease[]>(Channel.listUpdates, payload => {
      const [acceptPreReleases] = payload[0];
      const platform = this.appService.getPlatform();
      const arch = this.appService.getArch();
      return this.getReleasesByPlatform(platform, arch, acceptPreReleases);
    });

    // On update request
    this.ipcTunnelService.on<Array<[boolean]>, UpdateNotify>(Channel.updateApp, payload => {
      const [acceptPreReleases] = payload[0];
      return this.updateApp(acceptPreReleases);
    });

    // On check for updates
    this.ipcTunnelService.on<Array<[boolean]>, UpdateNotify>(Channel.checkForUpdate, payload => {
      const [acceptPreReleases] = payload[0];
      return this.checkForUpdate(acceptPreReleases);
    });
  }

  public updateApp(acceptPreReleases: boolean): Promise<UpdateNotify> {
    const platform = this.appService.getPlatform();
    const autoUpdatablePlatform = UpdateHandler.PLATFORM_AUTO_UPDATABLE_MAP.get(platform);

    this.logger.info(
      `Update app requested: platform=${platform}; autoUpdatable=${autoUpdatablePlatform}; acceptPreReleases=${acceptPreReleases}`
    );

    // Update on packaged app only
    if (this.appService.isPackaged) {
      // Is auto-updatable platform
      if (autoUpdatablePlatform) {
        // configure auto updater if not configured yet
        if (!this.autoUpdater) {
          this.configureAutomaticUpdates();
        }

        // Now trigger auto-update checking
        return this.checkForAutomaticUpdate(
          true /* Allow quit & install when update is requested */,
          acceptPreReleases
        );
      } else {
        // Check now manually is auto update not supported
        const arch = this.appService.getArch();
        return this.manualUpdateCheck(installedVersion, platform, arch, acceptPreReleases);
      }
    } else {
      this.logger.info(`No update: app is not packaged.`);
      return Promise.resolve(null);
    }
  }

  private checkForAutomaticUpdate(autoUpdateQuitInstall: boolean, acceptPreReleases: boolean): Promise<UpdateNotify> {
    this.autoUpdateQuitInstall = autoUpdateQuitInstall;
    this.autoUpdater.allowPrerelease = acceptPreReleases;

    // Prepare promise to return
    const updateNotifyPromise = pDefer<UpdateNotify>();

    // Listen for auto-update events and resolve/reject UpdateNotify when retrieved
    const autoUpdateNotifySub = this.autoUpdateNotify$.subscribe(
      updateNotify => updateNotifyPromise.resolve(updateNotify),
      error => updateNotifyPromise.reject(error)
    );

    // Now trigger auto-update checking
    this.autoUpdater.checkForUpdates().catch(err => {
      this.logger.error("Automatic update check error", err);
    });

    return updateNotifyPromise.promise.then(updateNotify => {
      this.logger.info("Automatic update check finished");
      autoUpdateNotifySub.unsubscribe();
      return Promise.resolve(updateNotify);
    });
  }

  public checkForUpdate(acceptPreReleases: boolean): Promise<UpdateNotify> {
    const platform = this.appService.getPlatform();
    const autoUpdatablePlatform = UpdateHandler.PLATFORM_AUTO_UPDATABLE_MAP.get(platform);

    this.logger.info(
      `Check for update requested: platform=${platform}; autoUpdatablePlatform=${autoUpdatablePlatform}; acceptPreReleases=${acceptPreReleases}`
    );

    if (autoUpdatablePlatform) {
      if (this.appService.isPackaged) {
        return this.checkForAutomaticUpdate(
          false /* Disallow quit & install when update is NOT requested: here simple checkForUpdate */,
          acceptPreReleases
        );
      } else {
        this.logger.debug(`Skip check for update on auto-updatable platform when app is not packaged`);
        return Promise.resolve(null);
      }
    } else {
      // Check now manually is auto update not supported
      const arch = this.appService.getArch();
      return this.manualUpdateCheck(installedVersion, platform, arch, acceptPreReleases);
    }
  }

  public manualUpdateCheck(
    clientVersion: string,
    platform: Platform,
    arch: Arch,
    acceptPreReleases: boolean
  ): Promise<UpdateNotify> {
    this.logger.info(
      `Manual update check: clientVersion=${clientVersion}; platform=${platform}; arch=${arch}; acceptPreReleases=${acceptPreReleases};`
    );

    return this.getLatestReleaseByPlatform(clientVersion, platform, arch, acceptPreReleases).then(platformReleases => {
      if (!platformReleases || !platformReleases.length) {
        return Promise.resolve(null);
      }

      const release = platformReleases[0].release;
      const asset = platformReleases[0].asset;

      const autoUpdatablePlatform = UpdateHandler.PLATFORM_AUTO_UPDATABLE_MAP.get(platform);
      let updateNotify: UpdateNotify;

      if (autoUpdatablePlatform) {
        updateNotify = new AutoUpdateNotify(release.tag_name, release.published_at, asset.size, release.body);
      } else {
        updateNotify = new StaticUpdateNotify(
          release.tag_name,
          release.published_at,
          asset.size,
          release.body,
          asset.browser_download_url,
          release.html_url
        );
      }

      this.logger.info(`Asset found. Notifying update: ${JSON.stringify(updateNotify)}`);

      return Promise.resolve(updateNotify);
    });
  }

  public getReleases(): Promise<GhRelease[]> {
    const releasesEndpoint = UpdateHandler.getGithubReleasesApiEndpoint(this.getRepositoryUrl());

    this.logger.info(`Seek for github releases from: ${releasesEndpoint}`);

    return this.httpClient
      .get(releasesEndpoint, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      })
      .then(response => {
        return response.message.statusCode === HttpCodes.OK
          ? response.readBody()
          : Promise.reject(`Unable to get github releases. Error: ${response.message.statusMessage}`);
      })
      .then(body => {
        try {
          const releases = JSON.parse(body) as GhRelease[];
          if (releases) {
            this.logger.info(`Found ${releases ? releases.length : 0} github releases`);
            return Promise.resolve(releases);
          } else {
            this.logger.info(`No github releases found`);
            return Promise.resolve(releases);
          }
        } catch (err) {
          const errMess = err.message || err;
          this.logger.error(`Unable to get github releases. Error: ${errMess}`);
          return Promise.reject(errMess);
        }
      });
  }

  public getLatestReleaseByPlatform(
    clientVersion: string,
    platform: Platform,
    arch: Arch,
    acceptPreReleases: boolean
  ): Promise<{ release: GhRelease; asset: GhAsset }[]> {
    return this.getReleases().then(releases => {
      if (!releases || !releases.length) {
        return Promise.resolve(null);
      }

      const platformReleases: { release: GhRelease; asset: GhAsset }[] = [];

      // Set target arch & target extension from client platform
      const archPattern = UpdateHandler.ARCH_TARGET_PATTERN_MAP.get(arch);
      const filePatternFun = UpdateHandler.PLATFORM_FILE_PATTERN_MAP.get(platform);

      // Seek for the first newer version
      // Release are parsed from newer to oldest
      for (const release of releases) {
        if (release.draft || (release.prerelease && !acceptPreReleases)) {
          continue;
        }

        // If client is already up-to-date: no need to loop on anything
        if (semverEquals(release.tag_name, clientVersion)) {
          break;
        }

        // Check for newer versions
        if (semverGreaterThan(release.tag_name, clientVersion)) {
          this.logger.info(`Found greater release version: ${release.tag_name}`);

          // We have a newer version than client one
          // Check for available assets
          const assetFound = _.find<GhAsset>(release.assets, asset => {
            const pattern = filePatternFun(archPattern);
            return !!new RegExp(pattern, "gi").exec(asset.browser_download_url);
          });

          // We found an eligible download
          if (assetFound) {
            platformReleases.push({ release: release, asset: assetFound });

            // Leaving update research, we found one !
            break;
          }
        }
      }

      return Promise.resolve(platformReleases);
    });
  }

  public getReleasesByPlatform(platform: Platform, arch: Arch, acceptPreReleases: boolean): Promise<GhRelease[]> {
    return this.getReleases().then(releases => {
      // Set target arch & target extension from client platform
      const archPattern = UpdateHandler.ARCH_TARGET_PATTERN_MAP.get(arch);
      const filePatternFun = UpdateHandler.PLATFORM_FILE_PATTERN_MAP.get(platform);

      const platformReleases: GhRelease[] = [];

      // Seek for the first newer version
      // Release are parsed from newer to oldest
      for (const release of releases) {
        if (release.draft || (release.prerelease && !acceptPreReleases)) {
          continue;
        }

        const assetFound = _.find<GhAsset>(release.assets, asset => {
          const pattern = filePatternFun(archPattern);
          return !!new RegExp(pattern, "gi").exec(asset.browser_download_url);
        });

        // We found an eligible download
        if (assetFound) {
          platformReleases.push(release);
        }
      }

      return Promise.resolve(platformReleases);
    });
  }

  public getRepositoryUrl(): string {
    return repository.url;
  }

  private configureAutomaticUpdates(): void {
    this.autoUpdateNotify$ = new Subject<UpdateNotify>();

    // Configure auto updater
    if (!this.autoUpdater) {
      this.autoUpdater = this.fetchConfigureAutoUpdater();

      this.logger.info(
        `Auto-updater configuration: allowPrerelease=${this.autoUpdater.allowPrerelease}; autoDownload=${this.autoUpdater.autoDownload}; autoInstallOnAppQuit=${this.autoUpdater.autoInstallOnAppQuit};`
      );

      this.autoUpdater.on(AutoUpdateEvent.CHECKING_FOR_UPDATE, () => {
        this.logger.info(AutoUpdateEvent.CHECKING_FOR_UPDATE);
      });

      this.autoUpdater.on(AutoUpdateEvent.UPDATE_AVAILABLE, (updateInfo: UpdateInfo) => {
        this.logger.info(AutoUpdateEvent.UPDATE_AVAILABLE, updateInfo);

        if (updateInfo.files && updateInfo.files.length) {
          const updateFileInfo: UpdateFileInfo = updateInfo.files[0];
          this.autoUpdateNotify$.next(
            new AutoUpdateNotify(
              updateInfo.version,
              new Date(updateInfo.releaseDate),
              updateFileInfo.size,
              typeof updateInfo.releaseNotes === "string" ? updateInfo.releaseNotes : null
            )
          );
        }
      });

      this.autoUpdater.on(AutoUpdateEvent.UPDATE_NOT_AVAILABLE, (updateInfo: UpdateInfo) => {
        this.logger.info(AutoUpdateEvent.UPDATE_NOT_AVAILABLE);
        this.autoUpdateNotify$.next(null);
      });

      this.autoUpdater.on(AutoUpdateEvent.ERROR, err => {
        this.logger.error(AutoUpdateEvent.ERROR, err);
        this.autoUpdateNotify$.error(err);
      });

      this.autoUpdater.on(AutoUpdateEvent.DOWNLOAD_PROGRESS, (progressInfo: ProgressInfo) => {
        this.logger.info(
          AutoUpdateEvent.DOWNLOAD_PROGRESS,
          `${_.round(progressInfo.percent, 1)}%,  ${_.round(progressInfo.bytesPerSecond / Math.pow(1024, 2))} MB/s`
        );

        this.ipcTunnelService.fwd<number, void>(new IpcMessage(Channel.updateDownloadProgress, progressInfo.percent));
      });

      this.autoUpdater.on(AutoUpdateEvent.UPDATE_DOWNLOADED, (updateInfo: UpdateInfo) => {
        this.logger.info(AutoUpdateEvent.UPDATE_DOWNLOADED, updateInfo);

        // Apply update
        if (this.autoUpdateQuitInstall) {
          this.logger.info("Quit and install");
          this.autoUpdater.quitAndInstall();
        }
      });
    } else {
      throw new ElevateException("Auto-updater is already configured");
    }
  }
}
