import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { SyncService } from "../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../shared/services/links-opener/open-resource-resolver";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: "app-garmin-connect",
  templateUrl: "./garmin-connect.component.html",
  styleUrls: ["./garmin-connect.component.scss"]
})
export class GarminConnectComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  constructor(
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {}
}
