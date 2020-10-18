import { Component, OnInit } from "@angular/core";
import { SyncBarComponent } from "./sync-bar.component";

@Component({
  selector: "app-extension-sync-bar",
  template: ``,
  styles: [``]
})
export class ExtensionSyncBarComponent extends SyncBarComponent implements OnInit {
  constructor() {
    super();
  }

  public ngOnInit(): void {}
}
