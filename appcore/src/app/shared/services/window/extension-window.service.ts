import { MediaObserver } from "@angular/flex-layout";
import { Inject, Injectable } from "@angular/core";
import { WindowService } from "./window.service";

@Injectable({
  providedIn: "root"
})
export class ExtensionWindowService extends WindowService {
  constructor(@Inject(MediaObserver) public mediaObserver: MediaObserver) {
    super(mediaObserver);
  }
}
