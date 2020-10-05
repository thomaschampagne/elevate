import { Component, Inject, OnInit } from "@angular/core";
import { AppLoadService } from "./app-load.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { sleep } from "@elevate/shared/tools";

@Component({
    selector: "app-load",
    template: `
        <div *ngIf="!isAppLoaded" id="init-app-container">
            <div class="wrapper">
                <div class="logo"></div>
                <div class="text mat-body-1">
                    <div>Warming up</div>
                </div>
            </div>
        </div>
        <app-root *ngIf="isAppLoaded"></app-root>
    `,
    styleUrls: ["./app-load.component.scss"],
})
export class AppLoadComponent implements OnInit {
    private static readonly SPLASH_SCREEN_MIN_TIME_DISPLAYED: number = 500;
    public isAppLoaded: boolean;

    constructor(
        @Inject(AppLoadService) private readonly appLoadService: AppLoadService,
        private readonly logger: LoggerService
    ) {
        this.isAppLoaded = false;
    }

    public ngOnInit(): void {
        this.logger.debug("App loading started");

        this.appLoadService
            .loadApp()
            .then(() => sleep(AppLoadComponent.SPLASH_SCREEN_MIN_TIME_DISPLAYED)) // Wait a minimum of time to display splash screen
            .then(() => {
                this.isAppLoaded = true;
                this.logger.debug("App loading ended");
            })
            .catch(err => this.logger.error(err));
    }
}
