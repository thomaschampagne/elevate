import { Component, HostBinding, Inject, OnInit } from "@angular/core";
import { SyncBarComponent } from "./sync-bar.component";
import { SyncService } from "../shared/services/sync/sync.service";
import { ExtensionSyncService } from "../shared/services/sync/impl/extension-sync.service";

@Component({
  selector: "app-extension-sync-bar",
  template: `
    <div class="app-sync-bar">
      <div fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
        <div fxLayout="column" fxLayoutAlign="center start">
          <span fxFlex class="mat-body-1">A synchronization is currently running into the next browser tab.</span>
        </div>
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <button mat-icon-button (click)="onActionClose()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ribbon {
        padding: 10px 20px;
        border-bottom: 1px solid #bfbfbf;
      }
    `
  ]
})
export class ExtensionSyncBarComponent extends SyncBarComponent implements OnInit {
  @HostBinding("hidden")
  public hiddenSyncBar: boolean;

  constructor(@Inject(SyncService) private readonly extensionSyncService: ExtensionSyncService) {
    super();
    this.hiddenSyncBar = true;
  }

  public ngOnInit(): void {
    this.extensionSyncService.isSyncing$.subscribe(isSyncing => {
      this.hiddenSyncBar = !isSyncing;
    });
  }

  public onActionClose(): void {
    this.hiddenSyncBar = true;
  }
}
