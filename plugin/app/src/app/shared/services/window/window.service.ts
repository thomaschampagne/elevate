import { MediaObserver } from "@angular/flex-layout";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class WindowService {

	public static readonly SCREEN_MD: string = "md";

	public resizing: Subject<void>;

	constructor(public media: MediaObserver) {
		this.resizing = new Subject<void>();
	}

	public isScreenMediaActive(query: string): boolean {
		return this.media.isActive(query);
	}

	public onResize(): void {
		this.resizing.next();
	}
}
