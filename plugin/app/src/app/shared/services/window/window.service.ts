import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

@Injectable()
export class WindowService {

	public resizing: Subject<Event>;

	constructor() {
		this.resizing = new Subject<Event>();
	}

	public onResize(event?: Event): void {
		this.resizing.next(event);
	}
}
