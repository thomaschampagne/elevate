import { Component, OnInit } from "@angular/core";
import moment, { Moment } from "moment";

@Component({
  selector: "app-year-progress-user-guide",
  templateUrl: "./year-progress-user-guide.component.html",
  styleUrls: ["./year-progress-user-guide.component.scss"]
})
export class YearProgressUserGuideComponent implements OnInit {
  public todayMoment: Moment;

  constructor() {}

  public ngOnInit(): void {
    this.todayMoment = moment();
  }
}
