import { Component, Inject, InjectionToken, OnInit } from "@angular/core";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";

export const APP_MORE_MENU_COMPONENT = new InjectionToken<AppMoreMenuComponent>("APP_MORE_MENU_COMPONENT");

@Component({ template: "" })
export class AppMoreMenuComponent implements OnInit {
  constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver
  ) {}

  public ngOnInit(): void {}

  public onShowReleaseNotes(): void {
    this.router.navigate([AppRoutesModel.releasesNotes]);
  }

  public onShowShare(): void {
    this.router.navigate([AppRoutesModel.share]);
  }

  public onShowReport(): void {
    this.router.navigate([AppRoutesModel.report]);
  }

  public onShowAbout(): void {
    this.dialog.open(AboutDialogComponent, {
      minWidth: AboutDialogComponent.MIN_WIDTH,
      maxWidth: AboutDialogComponent.MAX_WIDTH
    });
  }

  public onAdvanceMenu(): void {
    this.router.navigate([AppRoutesModel.advancedMenu]);
  }

  public onOpenLink(url: string) {
    this.openResourceResolver.openLink(url);
  }
}
