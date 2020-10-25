import { Component, Inject, OnInit } from "@angular/core";
import { AppLoadService } from "./app-load.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { sleep } from "@elevate/shared/tools";
import { AppService } from "../shared/services/app-service/app.service";

@Component({
  selector: "app-load",
  template: `
    <div *ngIf="!appService.isAppLoaded" id="init-app-container">
      <div class="wrapper">
        <div class="logo"></div>
        <div class="text mat-body-1">
          <div>Warming up</div>
        </div>
      </div>
    </div>
    <app-root *ngIf="appService.isAppLoaded"></app-root>
  `,
  styleUrls: ["./app-load.component.scss"]
})
export class AppLoadComponent implements OnInit {
  private static readonly SPLASH_SCREEN_MIN_TIME_DISPLAYED: number = 500;

  constructor(
    @Inject(AppLoadService) private readonly appLoadService: AppLoadService,
    @Inject(AppService) public readonly appService: AppService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.logger.debug("App loading started");

    sleep(AppLoadComponent.SPLASH_SCREEN_MIN_TIME_DISPLAYED) // Wait a minimum of time to display splash screen
      .then(() => {
        return this.appLoadService.loadApp();
      })
      .then(() => {
        this.logger.debug("App loading ended");
        this.appService.init();
      })
      .catch(err => this.logger.error(err));
  }
}
