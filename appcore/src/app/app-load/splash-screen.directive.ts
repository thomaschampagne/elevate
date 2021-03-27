import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appSplashScreen]"
})
export class SplashScreenDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
