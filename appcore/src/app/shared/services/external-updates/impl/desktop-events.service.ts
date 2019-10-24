import { Injectable } from "@angular/core";
import { AppEventsService } from "../app-events-service";

@Injectable()
export class DesktopEventsService extends AppEventsService {
	constructor() {
		super();
	}
}
