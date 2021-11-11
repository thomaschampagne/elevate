import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConnectorsComponent } from "../connectors.component";
import { StravaConnectorService } from "./strava-connector.service";
import moment from "moment";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { ElectronService } from "../../desktop/electron/electron.service";
import { adjectives, animals, colors, names, uniqueNamesGenerator } from "unique-names-generator";
import _ from "lodash";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../shared/services/links-opener/open-resource-resolver";
import { IClipboardResponse } from "ngx-clipboard";
import jdenticon from "jdenticon/standalone";
import { StatusCodes } from "http-status-codes";
import { Subscription } from "rxjs";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AppService } from "../../shared/services/app-service/app.service";
import { AppRoutes } from "../../shared/models/app-routes";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";

class GeneratedStravaApiApplication {
  public appName: string;
  public webSite: string;
  public imageFileName: string;
}

@Component({
  selector: "app-strava-connector",
  templateUrl: "./strava-connector.component.html",
  styleUrls: ["./strava-connector.component.scss"]
})
export class StravaConnectorComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public stravaConnectorInfo: StravaConnectorInfo;
  public expiresAt: string;

  public generatedStravaApiApplication: GeneratedStravaApiApplication;
  public showConfigure: boolean;
  public showHowTo: boolean;

  public historyChangesSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(StravaConnectorService) protected readonly stravaConnectorService: StravaConnectorService,
    @Inject(StravaConnectorInfoService) protected readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) protected readonly logger: LoggerService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.STRAVA;
    this.generatedStravaApiApplication = null;
    this.showConfigure = false;
    this.showHowTo = false;
  }

  public ngOnInit(): void {
    this.stravaConnectorService.fetch().then((stravaConnectorInfo: StravaConnectorInfo) => {
      this.updateSyncDateTimeText();
      this.handleCredentialsChanges(stravaConnectorInfo);
    });

    this.stravaConnectorInfoService.info$.subscribe((stravaConnectorInfo: StravaConnectorInfo) => {
      this.handleCredentialsChanges(stravaConnectorInfo);
    });

    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public refreshRandomStravaApiApplication(): void {
    this.randomStravaApiApplication()
      .then((generatedStravaApiApplication: GeneratedStravaApiApplication) => {
        this.generatedStravaApiApplication = generatedStravaApiApplication;
        setTimeout(() => jdenticon.update("#appIcon", this.generatedStravaApiApplication.appName));
      })
      .catch(err => {
        throw err;
      });
  }

  public handleCredentialsChanges(stravaConnectorInfo: StravaConnectorInfo): void {
    setTimeout(() => {
      this.stravaConnectorInfo = stravaConnectorInfo;
      this.expiresAt =
        this.stravaConnectorInfo.expiresAt > 0 ? moment(this.stravaConnectorInfo.expiresAt).format("LLLL") : null;
    });
  }

  public onClientIdChange(): void {
    this.resetTokens();
  }

  public onClientSecretChange(): void {
    this.resetTokens();
  }

  public resetTokens(): void {
    this.stravaConnectorService
      .fetch()
      .then((stravaConnectorInfo: StravaConnectorInfo) => {
        stravaConnectorInfo.clientId = this.stravaConnectorInfo.clientId;
        stravaConnectorInfo.clientSecret = this.stravaConnectorInfo.clientSecret
          ? this.stravaConnectorInfo.clientSecret.trim()
          : null;
        stravaConnectorInfo.accessToken = null;
        stravaConnectorInfo.refreshToken = null;
        stravaConnectorInfo.expiresAt = null;
        return this.stravaConnectorInfoService.update(stravaConnectorInfo);
      })
      .then((stravaConnectorInfo: StravaConnectorInfo) => {
        this.stravaConnectorInfo = stravaConnectorInfo;
        // Force clear cookie to allow connection with another strava account
        return this.electronService.api.clearStorageData({ storages: ["cookies"] });
      });
  }

  public onUpdateActivitiesNameAndTypeChanged(): void {
    this.stravaConnectorInfoService
      .update(this.stravaConnectorInfo)
      .then((stravaConnectorInfo: StravaConnectorInfo) => {
        this.stravaConnectorInfo = stravaConnectorInfo;
      });
  }

  public stravaAuthentication(): void {
    this.stravaConnectorService
      .authenticate()
      .then((stravaConnectorInfo: StravaConnectorInfo) => {
        this.stravaConnectorInfo = stravaConnectorInfo;
        this.showConfigure = false;
        this.showHowTo = false;
      })
      .catch(error => {
        let errorMessage = null;

        if (error.statusCode === StatusCodes.UNAUTHORIZED) {
          errorMessage = "Unauthorized access to strava. Check your client id and client secret.";
        } else if (error.statusCode === StatusCodes.FORBIDDEN) {
          errorMessage = "Forbidden access to strava. Please check your client id and client secret.";
        } else if (error.code === "EADDRINUSE") {
          errorMessage = "A Strava login window is already opened. Please use it.";
        } else {
          throw error;
        }

        this.snackBar.open(errorMessage, "Ok");
      });
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.stravaConnectorService.sync(fastSync, forceSync).catch(err => {
      if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    });
  }

  public onDisconnect(): void {
    this.resetTokens();
  }

  public randomStravaApiApplication(): Promise<GeneratedStravaApiApplication> {
    return new Promise(resolve => {
      this.logger.info("Generating a random strava api application");

      const appNameDictionaries =
        Math.floor(Math.random() * 10) % 2 === 0 ? [colors, adjectives, animals] : [adjectives, colors, names];

      const appName = uniqueNamesGenerator({
        dictionaries: appNameDictionaries,
        style: "lowerCase",
        separator: " "
      });

      const webSite =
        "https://" +
        uniqueNamesGenerator({
          dictionaries: [adjectives, names],
          style: "lowerCase",
          separator: ".",
          length: 2
        }) +
        "." +
        ["com", "org", "io"][Math.floor(Math.random() * 10) % 3];

      const imageFileName = Math.floor(Math.random() * 10000000).toString(16) + ".png";

      resolve({
        appName: _.upperFirst(appName),
        imageFileName: imageFileName,
        webSite: webSite
      });
    });
  }

  public onConfigure(): void {
    this.showConfigure = true;
  }

  public onHowToLinkAccount(): void {
    this.showHowTo = true;
    this.refreshRandomStravaApiApplication();
  }

  public onHowToSpeedUpSync(): void {
    this.router.navigate([`/${AppRoutes.help}`], { queryParams: { show: "id:strava-connector-faster-first-sync" } });
  }

  public onClipBoardSaved($event: IClipboardResponse): void {
    if ($event.isSuccess) {
      this.snackBar.open(`"${$event.content}" copied to clipboard.`, null, { duration: 1000 });
    }
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }
}
