import { NgModule } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { ChromeDataStore } from "../data-store/impl/chrome-data-store.service";
import { AppEventsService } from "../services/external-updates/app-events-service";
import { ChromeEventsService } from "../services/external-updates/impl/chrome-events.service";

@NgModule({
	providers: [
		{provide: DataStore, useClass: ChromeDataStore},
		{provide: AppEventsService, useClass: ChromeEventsService},
	]
})
export class ChromeModule {
}
