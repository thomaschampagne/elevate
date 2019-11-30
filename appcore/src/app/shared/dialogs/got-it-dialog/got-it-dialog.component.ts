import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GotItDialogDataModel } from "./got-it-dialog-data.model";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: "app-got-it-dialog",
	templateUrl: "./got-it-dialog.component.html",
	styleUrls: ["./got-it-dialog.component.scss"]
})
export class GotItDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public html: string;

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: GotItDialogDataModel,
				public domSanitizer: DomSanitizer) {
	}

	public ngOnInit(): void {
		this.html = <string> this.domSanitizer.bypassSecurityTrustHtml(this.dialogData.content);
	}
}
