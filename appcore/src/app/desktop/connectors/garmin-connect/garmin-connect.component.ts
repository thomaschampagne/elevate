import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../../shared/services/links-opener/open-resource-resolver";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import { AppService } from "../../../shared/services/app-service/app.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { GarminConnectorService } from "./garmin-connector.service";

@Component({
  selector: "app-garmin-connect",
  templateUrl: "./garmin-connect.component.html",
  styleUrls: ["./garmin-connect.component.scss"]
})
export class GarminConnectComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public static readonly PERSONAL_API_KEY_URL: string = "https://connect.garmin.com/app/settings/personalApiToken";
  public static readonly PERSONAL_API_DOCS_URL: string =
    "https://developer.garmin.com/gc-developer-program/personal/personal-faq/";

  public garminConnectorInfo: GarminConnectorInfo;
  public apiKeyDraft: string;
  public showConfigure: boolean;
  public isTestingKey: boolean;

  public historyChangesSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(GarminConnectorService) protected readonly garminConnectorService: GarminConnectorService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) protected readonly logger: LoggerService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.GARMIN;
    this.garminConnectorInfo = null;
    this.apiKeyDraft = null;
    this.showConfigure = false;
    this.isTestingKey = false;
  }

  public ngOnInit(): void {
    this.garminConnectorService.fetch().then((garminConnectorInfo: GarminConnectorInfo) => {
      this.garminConnectorInfo = garminConnectorInfo;
      this.apiKeyDraft = garminConnectorInfo.apiKey;
      this.updateSyncDateTimeText();
    });

    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public get isConfigured(): boolean {
    return !!this.garminConnectorInfo?.apiKey?.trim();
  }

  public onConfigure(): void {
    this.showConfigure = true;
  }

  public onOpenApiKeyPage(): void {
    this.openResourceResolver.openLink(GarminConnectComponent.PERSONAL_API_KEY_URL);
  }

  public onOpenApiDocs(): void {
    this.openResourceResolver.openLink(GarminConnectComponent.PERSONAL_API_DOCS_URL);
  }

  /**
   * Check the key against Garmin then save it when valid
   */
  public onSaveApiKey(): void {
    const apiKey = this.apiKeyDraft?.trim();

    if (!apiKey) {
      return;
    }

    this.isTestingKey = true;

    this.garminConnectorService
      .testApiKey(apiKey)
      .then(result => {
        if (!result.valid) {
          this.snackBar.open(result.message, "Ok");
          return Promise.resolve();
        }

        // Persist a copy: displayed state only changes once the key is saved
        const updatedInfo: GarminConnectorInfo = { ...this.garminConnectorInfo, apiKey: apiKey };
        return this.garminConnectorService.update(updatedInfo).then(garminConnectorInfo => {
          this.garminConnectorInfo = garminConnectorInfo;
          this.showConfigure = false;
          this.snackBar.open("Garmin connector configured. You can now sync your activities.", "Ok", {
            duration: 5000
          });
        });
      })
      .catch(error => {
        this.logger.error(error);
        this.snackBar.open("Unable to check the Garmin personal API key.", "Ok");
      })
      .finally(() => (this.isTestingKey = false));
  }

  public onUpdateActivitiesNameAndTypeChanged(): void {
    this.garminConnectorService.update(this.garminConnectorInfo).then(garminConnectorInfo => {
      this.garminConnectorInfo = garminConnectorInfo;
    });
  }

  public onDisconnect(): void {
    this.garminConnectorInfo.apiKey = null;
    this.apiKeyDraft = null;
    this.garminConnectorService.update(this.garminConnectorInfo).then(garminConnectorInfo => {
      this.garminConnectorInfo = garminConnectorInfo;
    });
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.garminConnectorService.sync(fastSync, forceSync).catch(err => {
      if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    });
  }

  public ngOnDestroy(): void {
    if (this.historyChangesSub) {
      this.historyChangesSub.unsubscribe();
    }
  }
}
