import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { NgPipesModule } from "ngx-pipes";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MaterialModule } from "../shared/modules/material.module";
import { KatexExpressionComponent } from "../shared/components/katex-expression.component";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		MaterialModule,
		HttpClientModule,
		FlexLayoutModule,
		NgPipesModule
	],
	exports: [
		CommonModule,
		FormsModule,
		MaterialModule,
		HttpClientModule,
		FlexLayoutModule,
		NgPipesModule,
		KatexExpressionComponent,
	],
	declarations: [
		KatexExpressionComponent
	]
})
export class CoreModule {
}
