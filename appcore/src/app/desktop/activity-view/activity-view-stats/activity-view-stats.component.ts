import { Component, Inject, Input, OnInit } from "@angular/core";
import { SyncedActivityModel } from "@elevate/shared/models";
import { MeasureSystem } from "@elevate/shared/enums";
import { ActivityStatsService } from "../shared/activity-stats.service";
import { StatGroupsDisplay } from "../shared/models/stats/display/stat-group-display.model";
import { MediaObserver } from "@angular/flex-layout";

@Component({
  selector: "app-activity-view-stats",
  templateUrl: "./activity-view-stats.component.html",
  styleUrls: ["./activity-view-stats.component.scss"]
})
export class ActivityViewStatsComponent implements OnInit {
  public readonly MD_ROW_COUNT: number = 6;
  public readonly LG_ROW_COUNT: number = 8;
  public readonly ROW_HEIGHT: string = "80px";

  public statsGroupDisplays: StatGroupsDisplay[];

  @Input()
  public activity: SyncedActivityModel;

  @Input()
  public measureSystem: MeasureSystem;

  constructor(
    @Inject(ActivityStatsService) protected readonly statsService: ActivityStatsService,
    @Inject(MediaObserver) public readonly mediaObserver: MediaObserver
  ) {}

  public ngOnInit(): void {
    this.statsGroupDisplays = this.statsService.getStatsGroupsDisplays(this.activity, this.measureSystem);
  }
}
