import { SyncEventType } from "@elevate/shared/events";

describe("Request listener", () => {

	it("should perform a test", (done: Function) => {
		expect(SyncEventType.ACTIVITY).not.toBeNull();
		done();
	});
});
