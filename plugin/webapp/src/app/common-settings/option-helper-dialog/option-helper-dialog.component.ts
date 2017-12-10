import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import * as MarkDownIt from "markdown-it";
import * as Katex from "markdown-it-katex";
import * as _ from "lodash";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { OptionHelperDataModel } from "./option-helper-data.model";

/**
 * Notes:
 * Math katex expressions reference:        https://khan.github.io/KaTeX/function-support.html
 * Test markdown katex math expressions:    http://waylonflinn.github.io/markdown-it-katex/
 * Supported emojis:                        https://github.com/markdown-it/markdown-it-emoji/blob/master/lib/data/shortcuts.js
 */

@Component({
	selector: "app-option-helper-dialog",
	templateUrl: "./option-helper-dialog.component.html",
	styleUrls: ["./option-helper-dialog.component.scss"]
})
export class OptionHelperDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public html: SafeHtml;
	public markDownParser: MarkDownIt.MarkdownIt;

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: OptionHelperDataModel,
				private domSanitizer: DomSanitizer) {
		this.markDownParser = new MarkDownIt();
		this.markDownParser.use(Katex, {"throwOnError": false, "errorColor": " #cc0000"});
	}

	public ngOnInit(): void {
		if (_.isEmpty(this.dialogData.markdownData)) {
			throw new Error("No markdown data provided. File is empty?!");
		} else {
			const html = this.markDownParser.render(this.dialogData.markdownData);
			this.html = this.domSanitizer.bypassSecurityTrustHtml(html);
		}
	}

}
