import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { ObservableMedia } from "@angular/flex-layout";

@Injectable()
export class WindowService {

	public static readonly SCREEN_LG: string = "lg";
	public static readonly SCREEN_MD: string = "md";
	public static readonly SCREEN_XS: string = "xs";

	public resizing: Subject<Event>;

	constructor(public media: ObservableMedia) {
		this.resizing = new Subject<Event>();
	}

	public isScreenMediaActive(query: string): boolean {
		return this.media.isActive(query);
	}

	public onResize(event?: Event): void {
		this.resizing.next(event);
	}
}
