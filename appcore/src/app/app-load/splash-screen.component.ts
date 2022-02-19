import { Component, InjectionToken, OnDestroy } from "@angular/core";

export const SPLASH_SCREEN_COMPONENT = new InjectionToken<SplashScreenComponent>("SPLASH_SCREEN_COMPONENT");

@Component({ template: "" })
export abstract class SplashScreenComponent implements OnDestroy {
  abstract ngOnDestroy(): void;
}
