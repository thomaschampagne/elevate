import { Component, Inject, OnInit, Type, ViewChild } from "@angular/core";
import { AppLoadService } from "./app-load.service";
import { AppService } from "../shared/services/app-service/app.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { SplashScreenDirective } from "./splash-screen.directive";
import { ComponentsFactoryService } from "../shared/services/components-factory.service";
import { SPLASH_SCREEN_COMPONENT, SplashScreenComponent } from "./splash-screen.component";

@Component({
  selector: "app-load",
  template: `
    <!-- Load target splash screen while app is not loaded -->
    <ng-container appSplashScreen></ng-container>

    <!-- Load target splash screen while app is not loaded -->
    <app-root *ngIf="appService.isAppLoaded"></app-root>
  `
})
export class AppLoadComponent implements OnInit {
  @ViewChild(SplashScreenDirective, { static: true })
  public appSplashScreenDirective: SplashScreenDirective;

  constructor(
    @Inject(AppLoadService) private readonly appLoadService: AppLoadService,
    @Inject(AppService) public readonly appService: AppService,
    @Inject(ComponentsFactoryService) private readonly componentsFactoryService: ComponentsFactoryService,
    @Inject(SPLASH_SCREEN_COMPONENT) private readonly splashScreenComponentType: Type<SplashScreenComponent>,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.logger.debug("App loading started");

    const splashScreenComponentRef = this.componentsFactoryService.create<SplashScreenComponent>(
      this.splashScreenComponentType,
      this.appSplashScreenDirective.viewContainerRef
    );

    this.appLoadService
      .loadApp()
      .then(() => {
        this.logger.debug("App loading ended");

        // Destroy splash screen component we don't need it anymore
        splashScreenComponentRef.destroy();

        // Then init app
        this.appService.init();
      })
      .catch(err => this.logger.error(err));
  }
}
