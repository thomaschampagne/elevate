import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { GarminConnectorService } from "./garmin-connector.service";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../../shared/services/links-opener/open-resource-resolver";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-garmin-connect",
  templateUrl: "./garmin-connect.component.html",
  styleUrls: ["./garmin-connect.component.scss"]
})
export class GarminConnectComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public garminConnectorInfo: GarminConnectorInfo;
  public isLinking: boolean;
  public isUnlinking: boolean;
  public isSyncing: boolean;
  protected syncSub: Subscription;

  public username: string;
  public password: string;

  constructor(
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(GarminConnectorService) public readonly garminConnectorService: GarminConnectorService,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.GARMIN;
    this.isLinking = false;
    this.isUnlinking = false;
    this.isSyncing = false;
    this.syncSub = null;
    this.username = null;
    this.password = null;
  }

  public ngOnInit(): void {
    this.garminConnectorInfo = this.garminConnectorService.fetch();
    this.updateSyncDateTimeText();
    this.syncSub = this.desktopSyncService.isSyncing$.subscribe((isSyncing: boolean) => {
      this.isSyncing = isSyncing;
    });
  }

  public ngOnDestroy(): void {
    if (this.syncSub) {
      this.syncSub.unsubscribe();
    }
  }

  public get isLinked(): boolean {
    return this.garminConnectorService.isLinked();
  }

  public onLinkAccount(): void {
    if (!this.username || !this.password) {
      this.snackBar.open("Please provide your Garmin Connect email and password.", "Ok", { duration: 6000 });
      return;
    }

    this.isLinking = true;
    this.garminConnectorService
      .authenticate(this.username, this.password)
      .then((garminConnectorInfo: GarminConnectorInfo) => {
        this.garminConnectorInfo = garminConnectorInfo;
        this.password = null;
        this.isLinking = false;
        this.snackBar.open("Garmin Connect account linked successfully.", "Ok", { duration: 6000 });
      })
      .catch(error => {
        this.isLinking = false;
        this.password = null;
        this.logger.error("Unable to link Garmin Connect account", error);
        const message = (error && error.message) || "Unable to link Garmin Connect account. Check your credentials.";
        this.snackBar.open(message, "Ok", { duration: 8000 });
      });
  }

  public onUnlinkAccount(): void {
    this.isUnlinking = true;
    this.garminConnectorService
      .unlink()
      .then(() => {
        this.garminConnectorInfo = this.garminConnectorService.fetch();
        this.isUnlinking = false;
        this.updateSyncDateTimeText();
        this.snackBar.open("Garmin Connect account unlinked.", "Ok", { duration: 6000 });
      })
      .catch(error => {
        this.isUnlinking = false;
        this.logger.error("Unable to unlink Garmin Connect account", error);
        this.snackBar.open("Unable to unlink Garmin Connect account.", "Ok", { duration: 6000 });
      });
  }

  public onSync(fastSync: boolean = true): void {
    this.garminConnectorService.sync(fastSync, null).catch(error => {
      this.logger.error("Unable to sync Garmin Connect activities", error);
      const message = (error && error.message) || "Unable to sync Garmin Connect activities.";
      this.snackBar.open(message, "Ok", { duration: 8000 });
    });
  }
}
