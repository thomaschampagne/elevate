import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appSyncBar]"
})
export class SyncBarDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
