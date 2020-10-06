import { inject, TestBed } from "@angular/core/testing";

import { ReleasesNotesResolverService } from "./releases-notes-resolver.service";

describe("ReleasesNotesResolverService", () => {
  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [ReleasesNotesResolverService],
    });
    done();
  });

  it("should be created", inject([ReleasesNotesResolverService], (service: ReleasesNotesResolverService) => {
    expect(service).toBeTruthy();
  }));
});
