import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { AppService } from "../../shared/services/app-service/app.service";
import { SplashScreenComponent } from "../splash-screen.component";

@Component({
  selector: "app-extension-splash-screen",
  template: `
    <div *ngIf="!appService.isAppLoaded" id="init-app-container">
      <div class="wrapper">
        <div class="logo"></div>
        <div class="text mat-h3">
          <div>Loading</div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ["./extension-splash-screen.component.scss"]
})
export class ExtensionSplashScreenComponent extends SplashScreenComponent implements OnInit, OnDestroy {
  constructor(@Inject(AppService) public readonly appService: AppService) {
    super();
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {}
}
