import { NgModule } from "@angular/core";
import { ActivityViewComponent } from "./activity-view.component";
import Plotly from "plotly.js-basic-dist";
import { PlotlyModule } from "angular-plotly.js";
import { ActivityViewRoutingModule } from "./activity-view-routing.module";
import { CoreModule } from "../../core/core.module";
import { ActivityGraphChartComponent } from "./activity-view-graph/activity-graph-chart.component";
import { ActivityViewTimeInZonesComponent } from "./activity-view-time-in-zones/activity-view-time-in-zones.component";
import { ActivityViewPeaksComponent } from "./activity-view-peaks/activity-view-peaks.component";
import { ActivityViewIntervalsComponent } from "./activity-view-intervals/activity-view-intervals.component";
import { ActivityViewBestSplitsComponent } from "./activity-view-best-splits/activity-view-best-splits.component";
import { TimeInZonesChartComponent } from "./activity-view-time-in-zones/time-in-zones-chart/time-in-zones-chart.component";
import { PeakChartComponent } from "./activity-view-peaks/peak-chart/peak-chart.component";
import { IntervalChartComponent } from "./activity-view-intervals/interval-chart/interval-chart.component";
import { TimeInZonesService } from "./activity-view-time-in-zones/services/time-in-zones.service";
import { ActivityViewService } from "./shared/activity-view.service";
import { ActivityViewSummaryStatsComponent } from "./activity-view-summary-stats/activity-view-summary-stats.component";
import { ActivityViewStatsComponent } from "./activity-view-stats/activity-view-stats.component";
import { ActivityStatsService } from "./shared/activity-stats.service";
import { ActivitySensorsService } from "./shared/activity-sensors.service";
import { ActivityEditDialogComponent } from "./activity-edit/activity-edit-dialog.component";
import { ActivityViewMapComponent } from "./activity-view-map/activity-view-map.component";

PlotlyModule.plotlyjs = Plotly;

@NgModule({
  imports: [CoreModule, ActivityViewRoutingModule, PlotlyModule],
  declarations: [
    ActivityViewComponent,
    ActivityViewMapComponent,
    ActivityGraphChartComponent,
    ActivityViewTimeInZonesComponent,
    ActivityViewPeaksComponent,
    ActivityViewIntervalsComponent,
    ActivityViewBestSplitsComponent,
    TimeInZonesChartComponent,
    PeakChartComponent,
    IntervalChartComponent,
    ActivityViewSummaryStatsComponent,
    ActivityViewStatsComponent,
    ActivityEditDialogComponent
  ],
  providers: [ActivityViewService, ActivitySensorsService, ActivityStatsService, TimeInZonesService]
})
export class ActivityViewModule {}
