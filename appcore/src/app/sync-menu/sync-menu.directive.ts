import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
	selector: "[appSyncMenu]"
})
export class SyncMenuDirective {
	constructor(public viewContainerRef: ViewContainerRef) {
	}
}
