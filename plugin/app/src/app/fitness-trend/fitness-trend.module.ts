import { NgModule } from "@angular/core";
import { FitnessTrendComponent } from "./fitness-trend.component";
import { FitnessTrendInputsComponent } from "./fitness-trend-inputs/fitness-trend-inputs.component";
import { FitnessTrendTableComponent } from "./fitness-trend-table/fitness-trend-table.component";
import { FitnessTrendLegendComponent } from "./fitness-trend-legend/fitness-trend-legend.component";
import { FitnessTrendGraphComponent } from "./fitness-trend-graph/fitness-trend-graph.component";
import { FitnessInfoDialogComponent } from "./fitness-trend-graph/fitness-info-dialog/fitness-info-dialog.component";
import { FitnessService } from "./shared/services/fitness.service";
import { ViewedDayService } from "./shared/services/viewed-day.service";
import { CoreModule } from "../core/core.module";
import { FitnessTrendRoutingModule } from "./fitness-trend-routing.module";

@NgModule({
	imports: [
		CoreModule,
		FitnessTrendRoutingModule
	],
	declarations: [
		FitnessTrendComponent,
		FitnessTrendInputsComponent,
		FitnessTrendLegendComponent,
		FitnessTrendGraphComponent,
		FitnessTrendTableComponent,
		FitnessInfoDialogComponent,
	],
	entryComponents: [
		FitnessInfoDialogComponent
	],
	providers: [
		FitnessService,
		ViewedDayService
	]
})
export class FitnessTrendModule {
}
