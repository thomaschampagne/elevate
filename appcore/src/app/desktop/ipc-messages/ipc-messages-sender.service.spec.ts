import { TestBed } from "@angular/core/testing";

import { IpcMessagesSender } from "./ipc-messages-sender.service";
import { PROMISE_TRON } from "./promise-tron.interface";
import { PromiseTronServiceMock } from "./promise-tron.service.mock";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";

describe("IpcMessagesSender", () => {
  let service: IpcMessagesSender;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TargetModule],
      providers: [{ provide: PROMISE_TRON, useClass: PromiseTronServiceMock }]
    });
    service = TestBed.inject(IpcMessagesSender);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
