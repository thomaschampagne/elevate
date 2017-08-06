import "hammerjs";
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";

import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MaterialModule} from "./material.module";
import {FlexLayoutModule} from "@angular/flex-layout";

import {AppComponent} from "./app.component";

/*
const appRoutes: Routes = [
  {path: 'hero', component: HeroComponent},
  {path: 'magic', component: MagicComponent},
  {
    path: "",
    redirectTo: 'hero',
    pathMatch: "full"
  },
];
*/
@NgModule({
  imports: [
    BrowserModule,
    // RouterModule.forRoot(appRoutes, {useHash: true}), // TODO move in proper module
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule
  ],
  declarations: [AppComponent, /*HeroComponent, MagicComponent*/],
  bootstrap: [AppComponent]
})
export class AppModule {
}
