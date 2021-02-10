import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

@NgModule({
  imports: [RouterModule.forRoot([], { relativeLinkResolution: "legacy" })],
  exports: [RouterModule]
})
export class TargetBootModule {}
