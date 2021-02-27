import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ElectronService } from "../../../desktop/electron/electron.service";
import { VersionsProvider } from "../../../shared/services/versions/versions-provider";

@Component({
  selector: "app-desktop-unauthorized-machine-id-dialog",
  templateUrl: "./desktop-unauthorized-machine-id-dialog.component.html",
  styleUrls: ["./desktop-unauthorized-machine-id-dialog.component.scss"]
})
export class DesktopUnauthorizedMachineIdDialogComponent implements OnInit {
  public releaseUrl: string;

  constructor(
    @Inject(ElectronService) private readonly electronService: ElectronService,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(MAT_DIALOG_DATA) public readonly athleteMachineId: string
  ) {
    this.athleteMachineId = athleteMachineId;
  }

  public ngOnInit(): void {
    this.releaseUrl = this.versionsProvider.getLatestReleaseUrl();
  }

  public closeApp(): void {
    this.electronService.closeApp();
  }
}
