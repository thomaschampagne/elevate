import { Component, InjectionToken } from "@angular/core";

export const UPDATE_BAR_COMPONENT = new InjectionToken<UpdateBarComponent>("UPDATE_BAR_COMPONENT");

@Component({ template: "" })
export abstract class UpdateBarComponent {}
