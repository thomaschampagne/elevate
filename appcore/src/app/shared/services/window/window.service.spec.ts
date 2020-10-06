import { inject, TestBed } from "@angular/core/testing";

import { WindowService } from "./window.service";
import { MediaObserver } from "@angular/flex-layout";

describe("WindowService", () => {
  let service: WindowService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      providers: [WindowService, MediaObserver],
    });

    service = TestBed.inject(WindowService);

    done();
  });

  it("should be created", inject([WindowService], (service: WindowService) => {
    expect(service).toBeTruthy();
  }));

  it("should notify subscribers when windows is resized", done => {
    // Given
    const expectedCallCount = 1;
    const spy = spyOn(service.resizing$, "next");

    // When
    service.onResize();

    // Then
    expect(spy).toHaveBeenCalledTimes(expectedCallCount);
    done();
  });
});
