import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appMoreMenu]"
})
export class AppMoreMenuDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
