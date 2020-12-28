import { ErrorHandler, NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { ElevateErrorHandler } from "./elevate-error-handler";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import { AppMoreMenuDirective } from "./app-more-menu/app-more-menu.directive";
import { RecalculateActivitiesBarDirective } from "./recalculate-activities-bar/recalculate-activities-bar.directive";
import { AppLoadComponent } from "./app-load/app-load.component";
import { TargetBootModule } from "./boot/target-boot.module";

@NgModule({
  declarations: [
    AppLoadComponent,
    AppComponent,
    TopBarDirective,
    SyncBarDirective,
    RecalculateActivitiesBarDirective,
    SyncMenuDirective,
    AppMoreMenuDirective
  ],
  imports: [SharedModule, TargetBootModule],
  providers: [{ provide: ErrorHandler, useClass: ElevateErrorHandler }],
  bootstrap: [AppLoadComponent]
})
export class AppModule {}
