import { Component, Inject, OnInit } from "@angular/core";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { Router } from "@angular/router";
import moment from "moment";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../shared/services/links-opener/open-resource-resolver";
import { SyncService } from "../../shared/services/sync/sync.service";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync/connector-sync-date-time.model";

@Component({
  selector: "app-connectors",
  templateUrl: "./connectors.component.html",
  styleUrls: ["./connectors.component.scss"]
})
export class ConnectorsComponent implements OnInit {
  constructor(
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    this.connectorType = null;
    this.syncDateTime = null;
    this.humanSyncDateTime = null;
  }

  public static readonly ATHLETE_CHECKING_FIRST_SYNC_MESSAGE: string = "ATHLETE_CHECKING_FIRST_SYNC";
  private static readonly SESSION_FIRST_SYNC_MESSAGE_SEEN = "SESSION_FIRST_SYNC_MESSAGE_SEEN";

  public connectorType: ConnectorType;
  public syncDateTime: Date;
  public humanSyncDateTime: string;

  public ngOnInit(): void {}

  public updateSyncDateTimeText(): void {
    this.getSyncDateTime().then(connectorSyncDateTime => {
      this.syncDateTime =
        connectorSyncDateTime && connectorSyncDateTime.syncDateTime
          ? new Date(connectorSyncDateTime.syncDateTime)
          : null;
      this.humanSyncDateTime =
        connectorSyncDateTime && connectorSyncDateTime.syncDateTime
          ? "Synced " + moment(connectorSyncDateTime.syncDateTime).fromNow() + "."
          : "Never synced.";
    });
  }

  public onOpenLink(url: string): void {
    const data: ConfirmDialogDataModel = {
      title: null,
      content:
        "If you are a fitness company or organization please DM me on below twitter for the integration of your connector.",
      confirmText: "@champagnethomas"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.openResourceResolver.openLink(url);
      }
    });
  }

  public getSyncDateTime(): Promise<ConnectorSyncDateTime> {
    return this.desktopSyncService.getSyncDateTimeByConnectorType(this.connectorType);
  }
}
