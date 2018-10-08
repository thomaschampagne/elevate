import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { YearProgressComponent } from "./year-progress.component";
import { YearProgressTableComponent } from "./year-progress-table/year-progress-table.component";
import { YearProgressGraphComponent } from "./year-progress-graph/year-progress-graph.component";
import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog/year-progress-helper-dialog.component";
import { YearProgressOverviewDialogComponent } from "./year-progress-overview-dialog/year-progress-overview-dialog.component";
import { YearProgressService } from "./shared/services/year-progress.service";
import { YearProgressRoutingModule } from "./year-progress-routing.module";
import { YearProgressDao } from "./shared/dao/year-progress.dao";

@NgModule({
	imports: [
		CoreModule,
		YearProgressRoutingModule
	],
	declarations: [
		YearProgressComponent,
		YearProgressGraphComponent,
		YearProgressTableComponent,
		YearProgressOverviewDialogComponent,
		YearProgressHelperDialogComponent
	],
	entryComponents: [
		YearProgressOverviewDialogComponent,
		YearProgressHelperDialogComponent,
	],
	providers: [
		YearProgressService,
		YearProgressDao
	]
})
export class YearProgressModule {
}
