import { TestBed } from "@angular/core/testing";
import { YearProgressDao } from "./year-progress.dao";

describe("YearProgressDao", () => {

	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", (done: Function) => {
		const service: YearProgressDao = TestBed.get(YearProgressDao);
		expect(service).toBeTruthy();
		done();
	});
});
