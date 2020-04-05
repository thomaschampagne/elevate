import { TestBed } from "@angular/core/testing";

import { StravaConnectorInfoDao } from "./strava-connector-info.dao";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DesktopModule } from "../../modules/desktop/desktop.module";

describe("StravaConnectorInfoDao", () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [
            CoreModule,
            SharedModule,
            DesktopModule
        ]
    }));

    it("should be created", () => {
        const service: StravaConnectorInfoDao = TestBed.inject(StravaConnectorInfoDao);
        expect(service).toBeTruthy();
    });
});
