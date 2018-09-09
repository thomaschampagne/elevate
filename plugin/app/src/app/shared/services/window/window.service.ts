import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ObservableMedia } from "@angular/flex-layout";

@Injectable()
export class WindowService {

	public static readonly SCREEN_MD: string = "md";

	public resizing: Subject<void>;

	constructor(public media: ObservableMedia) {
		this.resizing = new Subject<void>();
	}

	public isScreenMediaActive(query: string): boolean {
		return this.media.isActive(query);
	}

	public onResize(): void {
		this.resizing.next();
	}
}
