import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import * as MarkDownIt from "markdown-it";

@Component({
	selector: "app-faq",
	templateUrl: "./faq.component.html",
	styleUrls: ["./faq.component.scss"]
})
export class FaqComponent implements OnInit {

	private static readonly FAQ_URL: string = "https://raw.githubusercontent.com/wiki/thomaschampagne/elevate/Frequently-Asked-Questions.md";

	public html: SafeHtml;
	public markDownParser: MarkDownIt;

	public isFaqLoaded: boolean = null;

	constructor(public httpClient: HttpClient,
				public domSanitizer: DomSanitizer) {
	}

	public ngOnInit(): void {

		this.markDownParser = new MarkDownIt();

		this.httpClient.get(FaqComponent.FAQ_URL, {responseType: "text"}).toPromise().then((markdownData: string) => {

			this.html = this.domSanitizer.bypassSecurityTrustHtml(this.markDownParser.render(markdownData));
			this.isFaqLoaded = true;

		}, err => {
			console.error(err);
		});
	}

}
