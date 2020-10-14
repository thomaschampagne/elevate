import { Injectable } from "@angular/core";
import { GhRelease } from "../shared/services/versions/gh-release.model";
import { BuildTarget } from "@elevate/shared/enums";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import MarkDownIt from "markdown-it";

// Github release markdown pattern sample to retrieve proper releases note by platforms:
/*
# All platforms
<!--ALL-->
- Fixed bug #1
- Fixed bug #2
<!--/ALL-->

# Desktop
<!--DESKTOP-->
- Desktop feat 01
- Desktop feat 02
<!--/DESKTOP-->

# Web Extension
<!--EXTENSION-->
- Extension feat 01
- Extension feat 02
<!--/EXTENSION-->
*/

@Injectable()
export class ReleaseNoteService {
  public markDownParser: MarkDownIt;

  constructor(public readonly domSanitizer: DomSanitizer) {
    this.markDownParser = new MarkDownIt();
  }

  public getReleaseNoteAsMarkdownByBuildTarget(ghRelease: GhRelease, target: BuildTarget): string {
    // Seek for markdown data between ALL tag:
    const sharedMarkdown = this.getDataBetweenTags(ghRelease.body, "ALL");

    // Then seek for platform specific
    const specificMarkdown = this.getDataBetweenTags(ghRelease.body, BuildTarget[target]);

    const result = (sharedMarkdown ? sharedMarkdown : "") + (specificMarkdown ? specificMarkdown : "");
    return result ? result : null;
  }

  public getReleaseNoteAsHtmlByBuildTarget(ghRelease: GhRelease, target: BuildTarget): SafeHtml {
    const markdownData = this.getReleaseNoteAsMarkdownByBuildTarget(ghRelease, target);
    return markdownData ? this.domSanitizer.bypassSecurityTrustHtml(this.markDownParser.render(markdownData)) : null;
  }

  private getDataBetweenTags(body: string, tag: string): string {
    const regex = new RegExp(`<!--${tag}-->((.|\r|\n)*?)<!--\\/${tag}-->`, "gm");
    const matches = regex.exec(body);
    return matches ? matches[1] : null;
  }
}
