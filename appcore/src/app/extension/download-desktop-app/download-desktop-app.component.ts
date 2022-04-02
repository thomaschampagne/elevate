import { Component, Inject } from "@angular/core";
import { AppRoutes } from "../../shared/models/app-routes";
import { Router } from "@angular/router";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../shared/services/links-opener/open-resource-resolver";
import { AppPackage } from "@elevate/shared/tools/app-package";

@Component({
  selector: "app-download-desktop-app",
  templateUrl: "./download-desktop-app.component.html",
  styleUrls: ["./download-desktop-app.component.scss"]
})
export class DownloadDesktopAppComponent {
  constructor(
    @Inject(Router) private readonly router: Router,
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver
  ) {}

  public onWindowsDownload(): void {
    this.openResourceResolver.openLink(`${AppPackage.getElevateDoc()}/Download-%26-Install/Windows/`);
  }

  public onMacDownload(): void {
    this.openResourceResolver.openLink(`${AppPackage.getElevateDoc()}/Download-%26-Install/macOS/`);
  }

  public onDonateClicked(): void {
    this.router.navigate([AppRoutes.donate]);
  }
}
