import { MediaObserver } from "@angular/flex-layout";
import { Subject } from "rxjs";

export abstract class WindowService {
  public static readonly SCREEN_MD: string = "md";

  public resizing$: Subject<void>;

  protected constructor(public mediaObserver: MediaObserver) {
    this.resizing$ = new Subject<void>();
  }

  public isScreenMediaActive(query: string): boolean {
    return this.mediaObserver.isActive(query);
  }

  public onResize(): void {
    this.resizing$.next();
  }
}
