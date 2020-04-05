import { TestBed } from "@angular/core/testing";

import { StravaConnectorInfoService } from "./strava-connector-info.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DesktopModule } from "../../modules/desktop/desktop.module";

describe("StravaConnectorInfoService", () => {

    beforeEach(() => TestBed.configureTestingModule({
        imports: [
            CoreModule,
            SharedModule,
            DesktopModule
        ]
    }));

    it("should be created", () => {
        const service: StravaConnectorInfoService = TestBed.inject(StravaConnectorInfoService);
        expect(service).toBeTruthy();
    });
});
