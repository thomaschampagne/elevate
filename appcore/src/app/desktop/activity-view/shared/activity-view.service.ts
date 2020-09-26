import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class ActivityViewService {
  constructor() {
    this.graphMouseOverIndex$ = new Subject<number | false>();
    this.selectedGraphBounds$ = new Subject<number[] | null>();
  }

  /**
   * Provide activity stream index on which the mouse is on graph or "false" on mouse out
   */
  public graphMouseOverIndex$: Subject<number | false>;

  /**
   * Provides from/to bounds selected by user of graph
   */
  public selectedGraphBounds$: Subject<number[] | null>;
}
