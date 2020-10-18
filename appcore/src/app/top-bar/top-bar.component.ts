import { Component, InjectionToken } from "@angular/core";

export const TOP_BAR_COMPONENT = new InjectionToken<TopBarComponent>("TOP_BAR_COMPONENT");

@Component({ template: "" })
export class TopBarComponent {}
