import { TestBed } from "@angular/core/testing";

import { IpcRendererMessagesListenerService } from "./ipc-renderer-messages-listener.service";

describe("IpcRendererMessagesListenerService", () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", () => {
		const service: IpcRendererMessagesListenerService = TestBed.get(IpcRendererMessagesListenerService);
		expect(service).toBeTruthy();
	});
});
