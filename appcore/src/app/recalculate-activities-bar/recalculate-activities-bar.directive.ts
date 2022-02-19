import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appRecalculateActivitiesBar]"
})
export class RecalculateActivitiesBarDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
