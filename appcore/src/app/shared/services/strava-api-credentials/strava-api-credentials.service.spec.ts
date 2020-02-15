import { TestBed } from "@angular/core/testing";

import { StravaApiCredentialsService } from "./strava-api-credentials.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DesktopModule } from "../../modules/desktop/desktop.module";

describe("StravaApiCredentialsService", () => {

	beforeEach(() => TestBed.configureTestingModule({
		imports: [
			CoreModule,
			SharedModule,
			DesktopModule
		]
	}));

	it("should be created", () => {
		const service: StravaApiCredentialsService = TestBed.inject(StravaApiCredentialsService);
		expect(service).toBeTruthy();
	});
});
