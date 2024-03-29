import { inject, TestBed } from "@angular/core/testing";
import { SideNavService } from "./side-nav.service";
import { SideNavStatus } from "./side-nav-status.enum";

describe("SideNavService", () => {
  let service: SideNavService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [SideNavService]
    });

    service = TestBed.inject(SideNavService);
    done();
  });

  it("should be created", inject([SideNavService], (sideNavService: SideNavService) => {
    expect(sideNavService).toBeTruthy();
  }));

  it("should notify subscribers when side nav is closed", done => {
    // Given
    const expectedCallCount = 1;
    const spy = spyOn(service.changes$, "next");

    // When
    service.onChange(SideNavStatus.CLOSED);

    // Then
    expect(spy).toHaveBeenCalledTimes(expectedCallCount);
    expect(spy).toHaveBeenCalledWith(SideNavStatus.CLOSED);
    done();
  });

  it("should notify subscribers when side nav is opened", done => {
    // Given
    const expectedCallCount = 1;
    const spy = spyOn(service.changes$, "next");

    // When
    service.onChange(SideNavStatus.OPENED);

    // Then
    expect(spy).toHaveBeenCalledTimes(expectedCallCount);
    expect(spy).toHaveBeenCalledWith(SideNavStatus.OPENED);
    done();
  });
});
