import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-fitness-trend-user-guide",
  templateUrl: "./fitness-trend-user-guide.component.html",
  styleUrls: ["./fitness-trend-user-guide.component.scss"]
})
export class FitnessTrendUserGuideComponent implements OnInit {
  @Input()
  public readMore: boolean;

  constructor() {}

  public ngOnInit(): void {}
}
