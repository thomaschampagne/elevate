import { TestBed } from "@angular/core/testing";

import { ExtensionActivityService } from "./extension-activity.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { ExtensionModule } from "../../../modules/extension/extension.module";

describe("ExtensionActivityService", () => {
	let service: ExtensionActivityService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				ExtensionModule
			],
			providers: [
				ExtensionActivityService
			]
		});
		service = TestBed.inject(ExtensionActivityService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
