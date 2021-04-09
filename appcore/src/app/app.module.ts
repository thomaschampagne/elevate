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
import { UpdateBarDirective } from "./update-bar/update-bar.directive";
import { SplashScreenDirective } from "./app-load/splash-screen.directive";
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

@NgModule({
  declarations: [
    AppLoadComponent,
    AppComponent,
    SplashScreenDirective,
    TopBarDirective,
    UpdateBarDirective,
    SyncBarDirective,
    RecalculateActivitiesBarDirective,
    SyncMenuDirective,
    AppMoreMenuDirective
  ],
  imports: [
    SharedModule,
    TargetBootModule,
    HttpClientModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
        }
    })
  ],
  providers: [{ provide: ErrorHandler, useClass: ElevateErrorHandler }],
  bootstrap: [AppLoadComponent]
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}