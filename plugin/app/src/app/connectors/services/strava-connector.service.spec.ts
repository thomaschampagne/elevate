import { TestBed } from "@angular/core/testing";

import { StravaConnectorService } from "./strava-connector.service";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DesktopModule } from "../../shared/modules/desktop.module";

describe("StravaConnectorService", () => {
	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			]
		}).compileComponents();
		done();
	});

	it("should be created", () => {
		const service: StravaConnectorService = TestBed.get(StravaConnectorService);
		expect(service).toBeTruthy();
	});
});
