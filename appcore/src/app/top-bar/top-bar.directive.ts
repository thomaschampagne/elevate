import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appTopBar]"
})
export class TopBarDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
