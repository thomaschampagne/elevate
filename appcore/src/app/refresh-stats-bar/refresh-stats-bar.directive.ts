import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
    selector: "[appRefreshStatsBar]"
})
export class RefreshStatsBarDirective {
    constructor(public viewContainerRef: ViewContainerRef) {
    }
}
