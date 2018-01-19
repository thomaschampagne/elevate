import { inject, TestBed } from "@angular/core/testing";

import { ReleasesNotesResolverService } from "./releases-notes-resolver.service";

describe("ReleasesNotesResolverService", () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ReleasesNotesResolverService]
		});
	});

	it("should be created", inject([ReleasesNotesResolverService], (service: ReleasesNotesResolverService) => {
		expect(service).toBeTruthy();
	}));
});
