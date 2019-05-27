import { Proxy } from "./proxy";
import { NotImplementedException } from "@elevate/shared/exceptions";

describe("Proxy", () => {

	it("should perform a test", (done: Function) => {

		// Given

		// When
		Proxy.resolve(null);

		// Then
		throw new NotImplementedException("TBD");

		done();
	});
});
