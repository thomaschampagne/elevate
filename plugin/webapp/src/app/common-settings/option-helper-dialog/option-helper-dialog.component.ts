import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from "@angular/material";
import * as MarkDownIt from "markdown-it";
import * as Katex from "markdown-it-katex";
import * as Emoji from "markdown-it-emoji";
import * as _ from "lodash";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

export interface IOptionHelperData {
	title: string;
	markdownData: string;
}

@Component({
	selector: 'option-helper-dialog',
	templateUrl: './option-helper-dialog.component.html',
	styleUrls: ['./option-helper-dialog.component.scss']
})
export class OptionHelperDialogComponent implements OnInit {

	public static MAX_WIDTH: string = '80%';
	public static MIN_WIDTH: string = '40%';

	private html: SafeHtml;
	private markDownParser: MarkDownIt.MarkdownIt;

	constructor(@Inject(MAT_DIALOG_DATA) private _dialogData: IOptionHelperData,
				private domSanitizer: DomSanitizer) {
		this.markDownParser = new MarkDownIt();
		this.markDownParser.use(Katex, {"throwOnError": false, "errorColor": " #cc0000"});
		this.markDownParser.use(Emoji);
	}

	public ngOnInit() {
		if (_.isEmpty(this.dialogData.markdownData)) {
			throw new Error("No markdown data provided. File is empty?!");
		} else {
			const html = this.markDownParser.render(this.dialogData.markdownData);
			this.html = this.domSanitizer.bypassSecurityTrustHtml(html);
		}
	}

	get dialogData(): IOptionHelperData {
		return this._dialogData;
	}
}
/**
 * Notes:
 * Katex reference: https://khan.github.io/KaTeX/function-support.html
 * Test expression: http://waylonflinn.github.io/markdown-it-katex/
 * Emoji: https://github.com/markdown-it/markdown-it-emoji/blob/master/lib/data/shortcuts.js
 */
