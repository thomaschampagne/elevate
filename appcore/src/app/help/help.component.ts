import { Component, Inject, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import MarkDownIt from "markdown-it";
import { LoggerService } from "../shared/services/logging/logger.service";
import { repository } from "../../../../package.json";
import { environment } from "../../environments/environment";
import { BuildTarget } from "@elevate/shared/enums";
import _ from "lodash";
import { Constant } from "@elevate/shared/constants";
import { ActivatedRoute } from "@angular/router";
import { OPEN_RESOURCE_RESOLVER } from "../shared/services/links-opener/open-resource-resolver";
import { DesktopOpenResourceResolver } from "../shared/services/links-opener/impl/desktop-open-resource-resolver.service";

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
  private static readonly MARKDOWN_QUESTION_START_PATTERN = "### ";
  private static readonly MARKDOWN_CARRIAGE_RETURN = "\n";
  private static readonly FAQS_LIST = ["common", BuildTarget[environment.buildTarget].toLowerCase()];

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
    return HelpComponent.FAQS_LIST.reduce((previousPromise: Promise<void>, faq: string) => {
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
    const shortRepoName = this.getRepositoryUrl().split("/").slice(3, 5).join("/"); // Find out the short repo name from repo url
    return `https://raw.githubusercontent.com/${shortRepoName}/docs/faqs/${target}.md`;
  }

  private getFaqUrl(target: string): string {
    return `${this.getRepositoryUrl()}/blob/docs/faqs/${target}.md`;
  }

  public getRepositoryUrl(): string {
    return repository.url;
  }
}
