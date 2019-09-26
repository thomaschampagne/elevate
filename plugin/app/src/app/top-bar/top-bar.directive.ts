import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
	selector: "[appTopBar]"
})
export class TopBarDirective {
	constructor(public viewContainerRef: ViewContainerRef) {
	}
}
