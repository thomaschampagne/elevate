import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { Constant } from "@elevate/shared/constants";
import { AppRoutes } from "../shared/models/app-routes";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { repository } from "../../../../package.json";
import { countdown } from "@elevate/shared/tools";

@Component({
  selector: "app-report",
  templateUrl: "./report.component.html",
  styleUrls: ["./report.component.scss"]
})
export class ReportComponent implements OnInit {
  constructor(
    @Inject(Router) private readonly router: Router,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver
  ) {}

  private static readonly REPORT_COUNTDOWN_SECONDS: number = 20;

  public allowReportCountdown$: Observable<number>;

  public ngOnInit(): void {
    this.allowReportCountdown$ = countdown(ReportComponent.REPORT_COUNTDOWN_SECONDS);

    const hasCheckedHelperBefore = sessionStorage.getItem(Constant.SESSION_HELPER_OPENED);
    if (!hasCheckedHelperBefore) {
      const data: ConfirmDialogDataModel = {
        title: "Check help menu first!",
        content: "Before reporting anything you have to search for your issue in the help menu.",
        confirmText: "Open helper",
        cancelText: false
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        minWidth: ConfirmDialogComponent.MIN_WIDTH,
        maxWidth: ConfirmDialogComponent.MAX_WIDTH,
        data: data
      });

      dialogRef.afterClosed().subscribe((confirm: boolean) => {
        if (confirm) {
          this.router.navigate([AppRoutes.help]);
        }
      });
    }
  }

  public onGoToHelp(): void {
    this.router.navigate([`${AppRoutes.help}`]);
  }

  public onReport(): void {
    this.onGoToGithubIssues();
  }

  public getIssuesUrl(): string {
    return `${repository.url}/issues`;
  }

  public onGoToGithubIssues(): void {
    this.openResourceResolver.openLink(this.getIssuesUrl());
  }
}
