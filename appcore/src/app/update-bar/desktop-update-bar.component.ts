import { Component, HostBinding, Inject, OnInit } from "@angular/core";
import { UpdateBarComponent } from "./update-bar.component";
import { DesktopUpdateService } from "../desktop/app-update/desktop-update.service";
import { ElectronService } from "../desktop/electron/electron.service";
import { StaticUpdateNotify, UpdateNotify } from "@elevate/shared/models/updates/update-notify";

@Component({
  selector: "app-desktop-update-bar",
  template: ` <div class="app-update-bar" *ngIf="updateNotify">
    <div fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
      <div fxLayout="column" fxLayoutAlign="center start">
        <span fxFlex class="mat-body-1">New update {{ updateNotify.version }} is now available.</span>
      </div>
      <div fxLayout="row" fxLayoutAlign="space-between center">
        <button *ngIf="updateNotify.isAutoUpdatable" (click)="onRestartUpdate()" mat-flat-button>Restart</button>
        <button *ngIf="!updateNotify.isAutoUpdatable" (click)="onStaticDownload()" mat-flat-button>
          Download update
        </button>
      </div>
    </div>
  </div>`,
  styles: [
    `
      .ribbon {
        padding: 10px 20px;
      }

      button {
        margin-left: 10px;
      }
    `
  ]
})
export class DesktopUpdateBarComponent extends UpdateBarComponent implements OnInit {
  @HostBinding("hidden")
  public hiddenBar: boolean;

  public updateNotify: UpdateNotify;

  constructor(
    @Inject(DesktopUpdateService) protected readonly desktopUpdateService: DesktopUpdateService,
    @Inject(ElectronService) protected readonly electronService: ElectronService
  ) {
    super();
    this.hideBar();
    this.updateNotify = null;
  }

  public ngOnInit(): void {
    this.desktopUpdateService.updateNotify$.subscribe(updateNotify => {
      if (updateNotify) {
        this.showBar();
        this.updateNotify = updateNotify;
      }
    });
  }

  public onRestartUpdate(): void {
    this.electronService.restartApp();
  }

  public onStaticDownload(): void {
    const staticUpdateNotify = this.updateNotify as StaticUpdateNotify;
    this.desktopUpdateService.onStaticDownload(staticUpdateNotify, false);
  }

  private showBar(): void {
    this.hiddenBar = false;
  }

  private hideBar(): void {
    this.hiddenBar = true;
  }
}
