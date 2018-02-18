import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";

@NgModule({
	imports: [
		CommonModule,
		BrowserModule,
		HttpClientModule
	],
	exports: [
		CommonModule,
		BrowserModule,
		HttpClientModule
	],
	declarations: []
})
export class CoreModule {
}
