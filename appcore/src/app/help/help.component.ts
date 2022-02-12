import { Component, Inject, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import MarkDownIt from "markdown-it";
import { LoggerService } from "../shared/services/logging/logger.service";
import { environment } from "../../environments/environment";
import _ from "lodash";

import { ActivatedRoute } from "@angular/router";
import { OPEN_RESOURCE_RESOLVER } from "../shared/services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../shared/services/links-opener/impl/desktop-open-resource-resolver.service";
import { AppPackage } from "@elevate/shared/tools/app-package";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { Constant } from "@elevate/shared/constants/constant";

interface FaqEntry {
  question: string | SafeHtml;
  answer: string | SafeHtml;
  faqUrl: string;
  anchor: string;
}

@Component({
  selector: "app-help",
  templateUrl: "./help.component.html",
  styleUrls: ["./help.component.scss"]
})
export class HelpComponent implements OnInit {
  public static readonly ONLINE_DOC_ROOT_PATH = AppPackage.getElevateDoc();
  public static readonly RAW_MD_DOC_ROOT_PATH =
    "https://raw.githubusercontent.com/thomaschampagne/elevate-docs/master/docs/";

  private static readonly MARKDOWN_QUESTION_START_PATTERN = "## ";
  private static readonly MARKDOWN_CARRIAGE_RETURN = "\n";
  private static readonly TARGET_FAQS = ["common", BuildTarget[environment.buildTarget].toLowerCase()];
  private static readonly TARGET_RELATIVE_FAQ_DOC_PATH_MAP: Map<string, string> = new Map<string, string>([
    ["common", "Frequently-Asked-Questions/All-Platforms"],
    ["desktop", "Frequently-Asked-Questions/Desktop-App"],
    ["extension", "Frequently-Asked-Questions/Web-Extension"]
  ]);

  public markDownParser: MarkDownIt;
  public isFaqLoaded: boolean = null;
  public faqEntries: FaqEntry[];
  public keywords = null;

  constructor(
    @Inject(HttpClient) private readonly httpClient: HttpClient,
    @Inject(DomSanitizer) private readonly domSanitizer: DomSanitizer,
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(OPEN_RESOURCE_RESOLVER) public readonly openResourceResolver: DesktopOpenResourceResolver
  ) {
    this.markDownParser = new MarkDownIt();
    this.faqEntries = [];
  }

  public ngOnInit(): void {
    this.getMarkdownFaqStreams().then((faqMarkDowns: { faqUrl: string; md: string }[]) => {
      faqMarkDowns.forEach(faqMarkDown => {
        this.faqEntries = _.flatten([this.faqEntries, this.convertFaqMarkdownToFaqEntries(faqMarkDown)]);
      });
      this.isFaqLoaded = true;
    });

    this.route.queryParams.subscribe(param => {
      if (param.show) {
        this.keywords = param.show;
      }
    });

    // Indicates user checked helper at least once in this session
    sessionStorage.setItem(Constant.SESSION_HELPER_OPENED, "true");
  }

  private convertFaqMarkdownToFaqEntries(faqMarkDown: { faqUrl: string; md: string }): FaqEntry[] {
    const lines = faqMarkDown.md.split(HelpComponent.MARKDOWN_CARRIAGE_RETURN);

    const faqEntries: FaqEntry[] = [];

    let curFaqEntry: FaqEntry = null;

    // Function that register entry as SafeHtml
    const registerEntry = (entry: FaqEntry) => {
      // Remove markdown title pattern (we will use mat-card-title directly)
      entry.question =
        "➔️ " +
        (entry.question as string).slice(
          HelpComponent.MARKDOWN_QUESTION_START_PATTERN.length,
          (entry.question as string).length
        );

      // Convert markdown to html
      entry.question = this.domSanitizer.bypassSecurityTrustHtml(this.markDownParser.render(entry.question as string));
      entry.answer = this.domSanitizer.bypassSecurityTrustHtml(this.markDownParser.render(entry.answer as string));

      faqEntries.push(entry);
    };

    for (const [lineIndex, curLine] of lines.entries()) {
      const isNewEntry = curLine.startsWith(HelpComponent.MARKDOWN_QUESTION_START_PATTERN);

      if (isNewEntry) {
        if (lineIndex > 0) {
          // Register entry only if not first line
          registerEntry(curFaqEntry);
        }

        // Init new entry with question and empty answer
        const anchor = curLine
          .trim()
          .toLowerCase()
          .replace(/[^\w\-]+/g, " ")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/\-+$/, "");

        curFaqEntry = { question: curLine, answer: "", faqUrl: faqMarkDown.faqUrl, anchor: anchor };
      } else {
        curFaqEntry.answer += `${curLine}${HelpComponent.MARKDOWN_CARRIAGE_RETURN}`;
      }
    }

    // Push the last detected help entry if exists
    if (curFaqEntry) {
      registerEntry(curFaqEntry);
    }

    return faqEntries;
  }

  private getMarkdownFaqStreams(): Promise<{ faqUrl: string; md: string }[]> {
    const results: { faqUrl: string; md: string }[] = [];
    return HelpComponent.TARGET_FAQS.reduce((previousPromise: Promise<void>, faq: string) => {
      return previousPromise.then(() => {
        const rawFaqUrl = this.getRawFaqMarkdownUrl(faq);
        return this.fetchRemoteMarkdown(rawFaqUrl).then(md => {
          results.push({ faqUrl: this.getFaqUrl(faq), md: md });
          return Promise.resolve();
        });
      });
    }, Promise.resolve()).then(() => Promise.resolve(results));
  }

  private fetchRemoteMarkdown(url: string): Promise<string> {
    return this.httpClient.get(url, { responseType: "text" }).toPromise();
  }

  private getRawFaqMarkdownUrl(target: string): string {
    const faqPath = HelpComponent.TARGET_RELATIVE_FAQ_DOC_PATH_MAP.get(target);
    return `${HelpComponent.RAW_MD_DOC_ROOT_PATH}${faqPath}.md`;
  }

  private getFaqUrl(target: string): string {
    const faqPath = HelpComponent.TARGET_RELATIVE_FAQ_DOC_PATH_MAP.get(target);
    return `${HelpComponent.ONLINE_DOC_ROOT_PATH}${faqPath}`;
  }

  public viewHelpOnline(): void {
    this.openResourceResolver.openLink(HelpComponent.ONLINE_DOC_ROOT_PATH);
  }

  public viewFaqEntryOnline(faqEntry: FaqEntry): void {
    const anchorFaqUrl = faqEntry.faqUrl + (faqEntry.anchor ? `#${faqEntry.anchor}` : "");
    this.openResourceResolver.openLink(anchorFaqUrl);
  }

  public openLink(url: string): void {
    this.openResourceResolver.openLink(url);
  }
}
