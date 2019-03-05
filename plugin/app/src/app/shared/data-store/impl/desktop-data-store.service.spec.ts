import { TestBed } from "@angular/core/testing";

import { DesktopDataStore } from "./desktop-data-store.service";

describe("DesktopDataStore", () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it("should be created", () => {
		const service: DesktopDataStore<any> = TestBed.get(DesktopDataStore);
		expect(service).toBeTruthy();
	});
});
