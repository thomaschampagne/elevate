import { Component, OnInit } from "@angular/core";
import { UpdateBarComponent } from "./update-bar.component";

@Component({
  selector: "app-extension-update-bar",
  template: ""
})
export class ExtensionUpdateBarComponent extends UpdateBarComponent implements OnInit {
  constructor() {
    super();
  }
  public ngOnInit(): void {}
}
