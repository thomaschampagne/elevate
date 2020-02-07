import { TestBed } from "@angular/core/testing";

import { StreamsService } from "./streams.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";

describe("StreamsService", () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		});
	});

	it("should be created", () => {
		const service: StreamsService = TestBed.get(StreamsService);
		expect(service).toBeTruthy();
	});
});
