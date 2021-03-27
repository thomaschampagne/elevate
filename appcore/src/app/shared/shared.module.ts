import { NgModule } from "@angular/core";
import { GlobalSettingsComponent } from "../global-settings/global-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { ZonesImportExportDialogComponent } from "../zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ZoneToolBarComponent } from "../zones-settings/zone-tool-bar/zone-tool-bar.component";
import { GotItDialogComponent } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { ConfirmDialogComponent } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { OptionHelperDialogComponent } from "../global-settings/option-helper-dialog/option-helper-dialog.component";
import { GlobalSettingsService } from "../global-settings/services/global-settings.service";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { OptionHelperReaderService } from "../global-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { DonateComponent } from "../donate/donate.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { SideNavService } from "./services/side-nav/side-nav.service";
import { ReportComponent } from "../report/report.component";
import { CoreModule } from "../core/core.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { AthleteSnapshotResolverService } from "./services/athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { AthleteDao } from "./dao/athlete/athlete.dao";
import { ActivityDao } from "./dao/activity/activity.dao";
import { HelpComponent } from "../help/help.component";
import { ActivitiesComponent } from "../activities/activities.component";
import { LoggerService } from "./services/logging/logger.service";
import { ConsoleLoggerService } from "./services/logging/console-logger.service";
import { StreamsDao } from "./dao/streams/streams.dao";
import { StreamsService } from "./services/streams/streams.service";
import { ActivitiesSettingsLacksDialogComponent } from "../recalculate-activities-bar/activities-settings-lacks-dialog.component";
import { LoadingDialogComponent } from "./dialogs/loading-dialog/loading-dialog.component";
import { ReleaseNoteService } from "../releases-notes/release-note.service";
import { NewInstalledVersionNoticeDialogComponent } from "./services/versions/new-installed-version-notice-dialog.component";
import { TargetModule } from "./modules/target/target.module";
import { ComponentsFactoryService } from "./services/components-factory.service";

@NgModule({
  imports: [CoreModule, BrowserModule, BrowserAnimationsModule, TargetModule],
  exports: [CoreModule, BrowserModule, BrowserAnimationsModule, TargetModule],
  declarations: [
    // Components
    ActivitiesComponent,
    GlobalSettingsComponent,
    ZonesSettingsComponent,
    ZoneComponent,
    DonateComponent,
    ReportComponent,
    HelpComponent,

    // Dialogs
    LoadingDialogComponent,
    ZoneToolBarComponent,
    GotItDialogComponent,
    ConfirmDialogComponent,
    OptionHelperDialogComponent,
    ZonesImportExportDialogComponent,
    AboutDialogComponent,
    ActivitiesSettingsLacksDialogComponent,
    NewInstalledVersionNoticeDialogComponent
  ],
  providers: [
    ComponentsFactoryService,
    UserSettingsDao,
    AthleteDao,
    AthleteSnapshotResolverService,
    ActivityDao,
    StreamsService,
    StreamsDao,
    GlobalSettingsService,
    OptionHelperReaderService,
    ZonesService,
    SideNavService,
    ReleaseNoteService,
    { provide: LoggerService, useClass: ConsoleLoggerService }
  ]
})
export class SharedModule {}
