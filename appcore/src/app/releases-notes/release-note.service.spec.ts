import { TestBed } from "@angular/core/testing";

import { ReleaseNoteService } from "./release-note.service";
import { BuildTarget } from "@elevate/shared/enums";
import { ReleasesNotesModule } from "./releases-notes.module";
import { GhRelease } from "@elevate/shared/models";

describe("ReleaseNoteService", () => {
  let service: ReleaseNoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReleasesNotesModule]
    });
    service = TestBed.inject(ReleaseNoteService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Provide markdown release data", () => {
    it("should provide markdown data for BuildTarget.DESKTOP", done => {
      // Given
      const expectedMarkdown = "\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n";
      const ghRelease: GhRelease = {
        body: `# Desktop\r\n<!--DESKTOP-->\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n<!--/DESKTOP-->\r\n\r\n# Web Extension\r\n<!--EXTENSION-->\r\n- Extension feat 01\r\n- Extension feat 02\r\n<!--/EXTENSION-->\r\n`
      } as GhRelease;

      const buildTarget: BuildTarget = BuildTarget.DESKTOP;

      // When
      const markdown = service.getReleaseNoteAsMarkdownByBuildTarget(ghRelease, buildTarget);

      // Then
      expect(markdown).toEqual(expectedMarkdown);
      done();
    });

    it("should provide markdown data for BuildTarget.EXTENSION", done => {
      // Given
      const expectedMarkdown = "\r\n- Extension feat 01\r\n- Extension feat 02\r\n";
      const ghRelease: GhRelease = {
        body: `# Desktop\r\n<!--DESKTOP-->\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n<!--/DESKTOP-->\r\n\r\n# Web Extension\r\n<!--EXTENSION-->\r\n- Extension feat 01\r\n- Extension feat 02\r\n<!--/EXTENSION-->\r\n`
      } as GhRelease;

      const buildTarget: BuildTarget = BuildTarget.EXTENSION;

      // When
      const markdown = service.getReleaseNoteAsMarkdownByBuildTarget(ghRelease, buildTarget);

      // Then
      expect(markdown).toEqual(expectedMarkdown);
      done();
    });

    it("should provide markdown data for BuildTarget.DESKTOP with shared release note (ALL TAG)", done => {
      // Given
      const expectedMarkdown = "\r\n- Fixed bug #1\r\n- Fixed bug #2\r\n\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n";
      const ghRelease: GhRelease = {
        body: `# All platforms\r\n<!--ALL-->\r\n- Fixed bug #1\r\n- Fixed bug #2\r\n<!--/ALL-->\r\n\r\n# Desktop\r\n<!--DESKTOP-->\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n<!--/DESKTOP-->\r\n\r\n# Web Extension\r\n<!--EXTENSION-->\r\n- Extension feat 01\r\n- Extension feat 02\r\n<!--/EXTENSION-->\r\n`
      } as GhRelease;

      const buildTarget: BuildTarget = BuildTarget.DESKTOP;

      // When
      const markdown = service.getReleaseNoteAsMarkdownByBuildTarget(ghRelease, buildTarget);

      // Then
      expect(markdown).toEqual(expectedMarkdown);
      done();
    });

    it("should provide empty markdown data for BuildTarget.DESKTOP w/ with missing tags", done => {
      // Given
      const ghRelease: GhRelease = {
        body: `# Desktop\r\n\r\n- Desktop feat 01\r\n- Desktop feat 02\r\n\r\n\r\n# Web Extension\r\n<!--EXTENSION-->\r\n- Extension feat 01\r\n- Extension feat 02<!--/EXTENSION-->\r\n`
      } as GhRelease;

      const buildTarget: BuildTarget = BuildTarget.DESKTOP;

      // When
      const markdown = service.getReleaseNoteAsMarkdownByBuildTarget(ghRelease, buildTarget);

      // Then
      expect(markdown).toBeNull();
      done();
    });
  });
});
