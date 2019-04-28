import { SyncEventType } from "@elevate/shared/sync";

describe("IpcMainMessageListener", () => {

	it("should perform a test", (done: Function) => {
		expect(SyncEventType.ACTIVITY).not.toBeNull();
		done();
	});
});
