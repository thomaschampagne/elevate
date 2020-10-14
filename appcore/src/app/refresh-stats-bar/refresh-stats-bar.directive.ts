import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appRefreshStatsBar]"
})
export class RefreshStatsBarDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
