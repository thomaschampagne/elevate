import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
    selector: "[appMoreMenu]",
})
export class AppMoreMenuDirective {
    constructor(public viewContainerRef: ViewContainerRef) {}
}
