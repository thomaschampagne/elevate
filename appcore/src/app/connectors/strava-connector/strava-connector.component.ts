import { Component, Inject, OnInit } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConnectorType, StravaConnectorInfo } from "@elevate/shared/sync";
import { ConnectorsComponent } from "../connectors.component";
import { StravaConnectorService } from "../services/strava-connector.service";
import moment from "moment";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { ElectronService } from "../../shared/services/electron/electron.service";
import { adjectives, animals, colors, names, uniqueNamesGenerator } from "unique-names-generator";
import _ from "lodash";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver,
} from "../../shared/services/links-opener/open-resource-resolver";
import { IClipboardResponse } from "ngx-clipboard";
import jdenticon from "jdenticon/standalone";
import { StatusCodes } from "http-status-codes";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";

class GeneratedStravaApiApplication {
  public appName: string;
  public webSite: string;
  public imageFileName: string;
}

@Component({
  selector: "app-strava-connector",
  templateUrl: "./strava-connector.component.html",
  styleUrls: ["./strava-connector.component.scss"],
})
export class StravaConnectorComponent extends ConnectorsComponent implements OnInit {
  public stravaConnectorInfo: StravaConnectorInfo;
  public expiresAt: string;

  public generatedStravaApiApplication: GeneratedStravaApiApplication;
  public showConfigure: boolean;
  public showHowTo: boolean;

  constructor(
    public stravaConnectorService: StravaConnectorService,
    public desktopSyncService: DesktopSyncService,
    public appEventsService: AppEventsService,
    @Inject(OPEN_RESOURCE_RESOLVER) public openResourceResolver: OpenResourceResolver,
    public electronService: ElectronService,
    public router: Router,
    public snackBar: MatSnackBar,
    public logger: LoggerService,
    public dialog: MatDialog
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

    this.stravaConnectorService.stravaConnectorInfo$.subscribe((stravaConnectorInfo: StravaConnectorInfo) => {
      this.handleCredentialsChanges(stravaConnectorInfo);
    });

    this.appEventsService.syncDone$.subscribe((changes: boolean) => {
      if (changes) {
        this.ngOnInit();
      }
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
        return this.stravaConnectorService.stravaConnectorInfoService.update(stravaConnectorInfo);
      })
      .then((stravaConnectorInfo: StravaConnectorInfo) => {
        this.stravaConnectorInfo = stravaConnectorInfo;
        // Force clear cookie to allow connection with another strava account
        this.electronService.electron.remote
          .getCurrentWindow()
          .webContents.session.clearStorageData({ storages: ["cookies"] });
      });
  }

  public onUpdateActivitiesNameAndTypeChanged(): void {
    this.stravaConnectorService.stravaConnectorInfoService
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
    return super
      .sync()
      .then(() => {
        return this.stravaConnectorService.sync(fastSync, forceSync);
      })
      .catch(err => {
        if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
          return Promise.reject(err);
        }
        return Promise.resolve();
      });
  }

  public disconnect(): void {
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
        separator: " ",
      });

      const webSite =
        "https://" +
        uniqueNamesGenerator({
          dictionaries: [adjectives, names],
          style: "lowerCase",
          separator: ".",
          length: 2,
        }) +
        "." +
        ["com", "org", "io"][Math.floor(Math.random() * 10) % 3];

      const imageFileName = Math.floor(Math.random() * 10000000).toString(16) + ".png";

      resolve({
        appName: _.upperFirst(appName),
        imageFileName: imageFileName,
        webSite: webSite,
      });
    });
  }

  public onConfigure(): void {
    this.showConfigure = true;
  }

  public onHowToClicked(): void {
    this.showHowTo = true;
    this.refreshRandomStravaApiApplication();
  }

  public onClipBoardSaved($event: IClipboardResponse): void {
    if ($event.isSuccess) {
      this.snackBar.open(`"${$event.content}" copied to clipboard.`, null, { duration: 1000 });
    }
  }
}
