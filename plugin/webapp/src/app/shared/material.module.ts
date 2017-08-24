import {NgModule} from "@angular/core";
import {
  MdButtonModule,
  MdCheckboxModule,
  MdInputModule,
  MdMenuModule,
  MdIconModule,
  MdToolbarModule,
  MdSidenavModule,
  MdDialogModule,
  MdListModule
} from "@angular/material";

@NgModule({
  imports: [
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdMenuModule,
    MdIconModule,
    MdToolbarModule,
    MdSidenavModule,
    MdDialogModule,
    MdListModule
  ],
  exports: [
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdMenuModule,
    MdIconModule,
    MdToolbarModule,
    MdSidenavModule,
    MdDialogModule,
    MdListModule
  ]
})

export class MaterialModule {
}
