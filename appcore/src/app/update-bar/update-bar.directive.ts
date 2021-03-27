import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appUpdateBar]"
})
export class UpdateBarDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
