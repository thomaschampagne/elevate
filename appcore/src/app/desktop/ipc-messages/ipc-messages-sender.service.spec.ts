import { TestBed } from "@angular/core/testing";

import { IpcMessagesSender } from "./ipc-messages-sender.service";
import { PROMISE_TRON } from "./promise-tron.interface";
import { DesktopModule } from "../../shared/modules/desktop/desktop.module";
import { PromiseTronServiceMock } from "./promise-tron.service.mock";

describe("IpcMessagesSender", () => {
    let service: IpcMessagesSender;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DesktopModule],
            providers: [{ provide: PROMISE_TRON, useClass: PromiseTronServiceMock }],
        });
        service = TestBed.inject(IpcMessagesSender);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
