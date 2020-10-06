import { Subject } from "rxjs";

export abstract class AppEventsService {
  public syncDone$: Subject<boolean>;

  protected constructor() {
    this.syncDone$ = new Subject<boolean>();
  }
}
