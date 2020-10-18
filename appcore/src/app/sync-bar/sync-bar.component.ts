import { Component, InjectionToken } from "@angular/core";

export const SYNC_BAR_COMPONENT = new InjectionToken<SyncBarComponent>("SYNC_BAR_COMPONENT");

@Component({ template: "" })
export class SyncBarComponent {}
