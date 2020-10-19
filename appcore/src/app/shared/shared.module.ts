import { NgModule } from "@angular/core";
import { GlobalSettingsComponent } from "../global-settings/global-settings.component";
import { ZonesSettingsComponent } from "../zones-settings/zones-settings.component";
import { ZoneComponent } from "../zones-settings/zone/zone.component";
import { ZonesImportExportDialogComponent } from "../zones-settings/zones-import-export-dialog/zones-import-export-dialog.component";
import { ZoneToolBarComponent } from "../zones-settings/zone-tool-bar/zone-tool-bar.component";
import { GotItDialogComponent } from "./dialogs/got-it-dialog/got-it-dialog.component";
import { ConfirmDialogComponent } from "./dialogs/confirm-dialog/confirm-dialog.component";
import { OptionHelperDialogComponent } from "../global-settings/option-helper-dialog/option-helper-dialog.component";
import { UserSettingsService } from "./services/user-settings/user-settings.service";
import { GlobalSettingsService } from "../global-settings/services/global-settings.service";
import { UserSettingsDao } from "./dao/user-settings/user-settings.dao";
import { OptionHelperReaderService } from "../global-settings/services/option-helper-reader.service";
import { ZonesService } from "../zones-settings/shared/zones.service";
import { DonateComponent } from "../donate/donate.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";
import { WindowService } from "./services/window/window.service";
import { SideNavService } from "./services/side-nav/side-nav.service";
import {
  ImportBackupDialogComponent,
  ImportExportProgressDialogComponent
} from "./dialogs/import-backup-dialog/import-backup-dialog.component";
import { ShareComponent } from "../share/share.component";
import { ReportComponent } from "../report/report.component";
import { CoreModule } from "../core/core.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { AthleteSnapshotResolverService } from "./services/athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { AthleteService } from "./services/athlete/athlete.service";
import { AthleteDao } from "./dao/athlete/athlete.dao";
import { ActivityDao } from "./dao/activity/activity.dao";
import { HelpComponent } from "../help/help.component";
import { ActivitiesComponent } from "../activities/activities.component";
import { LoggerService } from "./services/logging/logger.service";
import { ConsoleLoggerService } from "./services/logging/console-logger.service";
import { StreamsDao } from "./dao/streams/streams.dao";
import { StreamsService } from "./services/streams/streams.service";
import { ActivitiesSettingsLacksDialogComponent } from "../refresh-stats-bar/activities-settings-lacks-dialog.component";
import { LoadingDialogComponent } from "./dialogs/loading-dialog/loading-dialog.component";
import { NewRemoteVersionNoticeDialogComponent } from "./services/versions/new-remote-version-notice-dialog.component";
import { ReleaseNoteService } from "../releases-notes/release-note.service";
import { NewInstalledVersionNoticeDialogComponent } from "./services/versions/new-installed-version-notice-dialog.component";
import { TargetModule } from "./modules/target/target.module";

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
    ShareComponent,
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
    ImportBackupDialogComponent,
    ImportExportProgressDialogComponent,
    ActivitiesSettingsLacksDialogComponent,
    NewRemoteVersionNoticeDialogComponent,
    NewInstalledVersionNoticeDialogComponent
  ],
  providers: [
    UserSettingsService,
    UserSettingsDao,
    AthleteService,
    AthleteDao,
    AthleteSnapshotResolverService,
    ActivityDao,
    StreamsService,
    StreamsDao,
    GlobalSettingsService,
    OptionHelperReaderService,
    ZonesService,
    SideNavService,
    WindowService,
    ReleaseNoteService,
    { provide: LoggerService, useClass: ConsoleLoggerService }
  ]
})
export class SharedModule {}
