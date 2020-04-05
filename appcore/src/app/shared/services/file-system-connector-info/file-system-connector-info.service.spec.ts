import { TestBed } from "@angular/core/testing";

import { FileSystemConnectorInfoService } from "./file-system-connector-info.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { DesktopModule } from "../../modules/desktop/desktop.module";

describe("FileSystemConnectorInfoService", () => {

    beforeEach(() => TestBed.configureTestingModule({
        imports: [
            CoreModule,
            SharedModule,
            DesktopModule
        ]
    }));

    it("should be created", () => {
        const service: FileSystemConnectorInfoService = TestBed.inject(FileSystemConnectorInfoService);
        expect(service).toBeTruthy();
    });
});
