import { Component, Inject, InjectionToken, OnInit } from "@angular/core";
import { AppRoutes } from "../shared/models/app-routes";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { HelpComponent } from "../help/help.component";

export const APP_MORE_MENU_COMPONENT = new InjectionToken<AppMoreMenuComponent>("APP_MORE_MENU_COMPONENT");

@Component({ template: "" })
export abstract class AppMoreMenuComponent implements OnInit {
  constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver
  ) {}

  public ngOnInit(): void {}

  public onShowReleaseNotes(): void {
    this.router.navigate([AppRoutes.releasesNotes]);
  }

  public onShowReport(): void {
    this.router.navigate([AppRoutes.report]);
  }

  public onShowAbout(): void {
    this.dialog.open(AboutDialogComponent, {
      minWidth: AboutDialogComponent.MIN_WIDTH,
      maxWidth: AboutDialogComponent.MAX_WIDTH
    });
  }

  public onOnlineDoc(): void {
    this.openResourceResolver.openLink(HelpComponent.ONLINE_DOC_ROOT_PATH);
  }

  public onAdvanceMenu(): void {
    this.router.navigate([AppRoutes.advancedMenu]);
  }

  public onOpenLink(url: string) {
    this.openResourceResolver.openLink(url);
  }
}
