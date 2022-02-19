import { Directive, Inject, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[appSyncMenu]"
})
export class SyncMenuDirective {
  constructor(@Inject(ViewContainerRef) public readonly viewContainerRef: ViewContainerRef) {}
}
