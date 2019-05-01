import { TestBed } from "@angular/core/testing";

import { IpcRendererMessagesService } from "./ipc-renderer-messages.service";

describe("IpcRendererMessagesService", () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", () => {
		const service: IpcRendererMessagesService = TestBed.get(IpcRendererMessagesService);
		expect(service).toBeTruthy();
	});
});
