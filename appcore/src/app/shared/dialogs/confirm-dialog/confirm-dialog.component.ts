import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfirmDialogDataModel } from "./confirm-dialog-data.model";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: "app-confirm-dialog",
	templateUrl: "./confirm-dialog.component.html",
	styleUrls: ["./confirm-dialog.component.scss"]
})
export class ConfirmDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public html: string;

	constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
				public domSanitizer: DomSanitizer,
				@Inject(MAT_DIALOG_DATA) public dialogData: ConfirmDialogDataModel) {
	}

	public ngOnInit() {
		this.html = <string> this.domSanitizer.bypassSecurityTrustHtml(this.dialogData.content);
	}

	public onConfirm() {
		this.dialogRef.close(true);
	}

	public onCancel() {
		this.dialogRef.close(false);
	}
}
