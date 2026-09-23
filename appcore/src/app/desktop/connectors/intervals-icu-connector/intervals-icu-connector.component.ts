import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
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
import { IntervalsIcuConnectorService } from "./intervals-icu-connector.service";
import { IntervalsIcuConnectorInfoService } from "../../../shared/services/intervals-icu-connector-info/intervals-icu-connector-info.service";
import { IntervalsIcuConnectorInfo } from "@elevate/shared/sync/connectors/intervals-icu-connector-info.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

@Component({
  selector: "app-intervals-icu-connector",
  templateUrl: "./intervals-icu-connector.component.html",
  styleUrls: ["./intervals-icu-connector.component.scss"]
})
export class IntervalsIcuConnectorComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public static readonly SETTINGS_URL: string = "https://intervals.icu/settings";

  public showConfigure: boolean;
  public intervalsIcuConnectorInfo: IntervalsIcuConnectorInfo;
  public historyChangesSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(IntervalsIcuConnectorInfoService)
    protected readonly intervalsIcuConnectorInfoService: IntervalsIcuConnectorInfoService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(IntervalsIcuConnectorService) protected readonly intervalsIcuConnectorService: IntervalsIcuConnectorService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.INTERVALS_ICU;
    this.showConfigure = false;
    this.intervalsIcuConnectorInfo = null;
  }

  public ngOnInit(): void {
    this.intervalsIcuConnectorInfo = this.intervalsIcuConnectorInfoService.fetch();
    this.updateSyncDateTimeText();

    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public get isConfigured(): boolean {
    return IntervalsIcuConnectorInfoService.isConfigured(this.intervalsIcuConnectorInfo);
  }

  public saveChanges(): void {
    this.intervalsIcuConnectorInfo.athleteId = this.intervalsIcuConnectorInfo.athleteId?.trim() || null;
    this.intervalsIcuConnectorInfo.apiKey = this.intervalsIcuConnectorInfo.apiKey?.trim() || null;
    this.intervalsIcuConnectorInfoService.save(this.intervalsIcuConnectorInfo);
  }

  public onOpenSettings(): void {
    this.openResourceResolver.openLink(IntervalsIcuConnectorComponent.SETTINGS_URL);
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.intervalsIcuConnectorService.sync(fastSync, forceSync).catch(err => {
      if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    });
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }
}
