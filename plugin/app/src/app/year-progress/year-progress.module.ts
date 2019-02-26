import { NgModule } from "@angular/core";
import { CoreModule } from "../core/core.module";
import { YearProgressComponent } from "./year-progress.component";
import { YearProgressTableComponent } from "./year-progress-table/year-progress-table.component";
import { YearProgressGraphComponent } from "./year-progress-graph/year-progress-graph.component";
import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog/year-progress-helper-dialog.component";
import { YearProgressOverviewDialogComponent } from "./year-progress-overview-dialog/year-progress-overview-dialog.component";
import { YearProgressService } from "./shared/services/year-progress.service";
import { YearProgressRoutingModule } from "./year-progress-routing.module";
import { YearProgressPresetDao } from "./shared/dao/year-progress-preset.dao";
import { AddYearProgressPresetDialogComponent } from "./add-year-progress-presets-dialog/add-year-progress-preset-dialog.component";
import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog/manage-year-progress-presets-dialog.component";
import { YearProgressWelcomeDialogComponent } from "./year-progress-welcome-dialog/year-progress-welcome-dialog.component";

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
		YearProgressHelperDialogComponent,
		AddYearProgressPresetDialogComponent,
		ManageYearProgressPresetsDialogComponent,
		YearProgressWelcomeDialogComponent
	],
	entryComponents: [
		YearProgressOverviewDialogComponent,
		YearProgressHelperDialogComponent,
		AddYearProgressPresetDialogComponent,
		ManageYearProgressPresetsDialogComponent,
		YearProgressWelcomeDialogComponent
	],
	providers: [
		YearProgressService,
		YearProgressPresetDao
	]
})
export class YearProgressModule {
}
