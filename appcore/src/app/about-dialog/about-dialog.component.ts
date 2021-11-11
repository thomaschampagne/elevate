import { Component, Inject, OnInit, VERSION as angularCoreVersion } from "@angular/core";
import { AppUsageDetails } from "../shared/models/app-usage-details.model";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { environment } from "../../environments/environment";
import { DataStore } from "../shared/data-store/data-store";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { LoggerService } from "../shared/services/logging/logger.service";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";

@Component({
  selector: "app-about-dialog",
  templateUrl: "./about-dialog.component.html",
  styleUrls: ["./about-dialog.component.scss"]
})
export class AboutDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "40%";
  public static readonly MIN_WIDTH: string = "40%";

  public buildTarget: BuildTarget = environment.buildTarget;
  public BuildTarget = BuildTarget;

  public appUsageDetails: AppUsageDetails;
  public installedVersion: string;
  public remoteVersion: string;
  public buildMetadata: { commit: string; date: string };

  constructor(
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(DataStore) private readonly dataStore: DataStore<object>,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.dataStore.getAppUsageDetails().then((appUsageDetails: AppUsageDetails) => {
      this.appUsageDetails = appUsageDetails;
    });

    this.installedVersion = this.versionsProvider.getPackageVersion();

    this.versionsProvider.getBuildMetadata().then((buildMetadata: { commit: string; date: string }) => {
      this.buildMetadata = buildMetadata;
      this.buildMetadata.date = this.buildMetadata.date.slice(0, 10).replace(/-/g, "");
    });

    this.printAboutBanner();
  }

  private printAboutBanner(): void {
    this.logger.info(`
========================================================
                      ABOUT ELEVATE
--------------------------------------------------------
App Version:                      ${this.installedVersion}
Angular Version:                  ${angularCoreVersion.full}
Angular Material Version:         ${angularCoreVersion.full}
Wrapper Version:                  ${this.versionsProvider.getWrapperVersion()}
========================================================`);
  }

  public openSocial(url: string): void {
    this.openResourceResolver.openLink(url);
  }
}
