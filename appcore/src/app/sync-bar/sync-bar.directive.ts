import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
	selector: "[appSyncBar]"
})
export class SyncBarDirective {
	constructor(public viewContainerRef: ViewContainerRef) {
	}
}
