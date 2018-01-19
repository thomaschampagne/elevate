import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { SideNavStatus } from "./side-nav-status.enum";

@Injectable()
export class SideNavService {

	public changes: Subject<SideNavStatus>;

	constructor() {
		this.changes = new Subject<SideNavStatus>();
	}

	public onChange(status: SideNavStatus): void {
		this.changes.next(status);
	}

}
